import { db } from '../../config/firebase.js'
import crypto from 'crypto'

export class PassService {
  static async getPass(id) {
    try {
      const doc = await db.collection('pass_types').doc(id).get()
      if (!doc.exists) {
        throw new Error('Pass not found')
      }
      return { id: doc.id, ...doc.data() }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get available passes, optionally filtered by event (fest).
   * @param {Object} filters - optional { eventId } to get passes attached to that event
   */
  static async getPasses(filters = {}) {
    try {
      let query = db.collection('pass_types').where('active', '==', true)
      if (filters.eventId) {
        query = query.where('eventId', '==', filters.eventId)
      }
      const snapshot = await query.get()
      let passes = []
      snapshot.forEach(doc => {
        passes.push({ id: doc.id, ...doc.data() })
      })
      passes.sort((a, b) => (a.price || 0) - (b.price || 0))
      return passes
    } catch (error) {
      console.error('[PassService.getPasses] Error:', error.message)
      return []
    }
  }

  static async getUserPasses(userId) {
    try {
      const snapshot = await db.collection('user_passes')
        .where('userId', '==', userId)
        .get()
      
      let passes = []
      
      for (const doc of snapshot.docs) {
        const passData = doc.data()
        
        // Get pass type details
        const passTypeDoc = await db.collection('pass_types').doc(passData.passType).get()
        const passTypeData = passTypeDoc.exists ? passTypeDoc.data() : null
        
        passes.push({
          id: doc.id,
          ...passData,
          passTypeDetails: passTypeData
        })
      }
      
      // Sort client-side
      passes.sort((a, b) => {
        const dateA = a.purchasedAt ? new Date(a.purchasedAt) : new Date(0)
        const dateB = b.purchasedAt ? new Date(b.purchasedAt) : new Date(0)
        return dateB - dateA
      })
      
      return passes
    } catch (error) {
      throw error
    }
  }

  static async getUserPass(userId) {
    try {
      const snapshot = await db.collection('user_passes')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .limit(1)
        .get()
      
      if (snapshot.empty) {
        return null
      }
      
      const doc = snapshot.docs[0]
      const passData = doc.data()
      
      // Get pass type details
      const passTypeDoc = await db.collection('pass_types').doc(passData.passType).get()
      const passTypeData = passTypeDoc.exists ? passTypeDoc.data() : null
      
      return {
        id: doc.id,
        ...passData,
        passTypeDetails: passTypeData
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate if user can register for a pass/sub-event.
   * Since passes = sub-events, owning a pass of this type means you have access.
   * eventId here is actually a passType ID (pass_types doc ID).
   */
  static async validatePassForEvent(userId, eventId) {
    try {
      const passes = await this.getUserPasses(userId)
      const activePasses = passes.filter((p) => p.status === 'active')

      if (activePasses.length === 0) {
        return { valid: false, reason: 'You need to purchase a pass first' }
      }

      // Passes = sub-events. If user owns a pass whose passType matches eventId, they have access.
      for (const userPass of activePasses) {
        if (userPass.passType === eventId) {
          const passType = userPass.passTypeDetails || {}
          const maxEvents = passType.maxEvents ?? userPass.maxEvents ?? 0
          const eventsRegistered = userPass.eventsRegistered ?? 0

          if (maxEvents > 0 && eventsRegistered >= maxEvents) {
            return { valid: false, reason: 'You have reached the maximum registration limit for this pass.' }
          }

          return {
            valid: true,
            eventsRemaining: maxEvents > 0 ? maxEvents - eventsRegistered : 999
          }
        }
      }

      return {
        valid: false,
        reason: 'You need to purchase this pass to register. Each pass is a sub-event.'
      }
    } catch (error) {
      console.error('[PassService.validatePassForEvent] Error:', error.message)
      return { valid: false, reason: 'Error validating pass' }
    }
  }

  /**
   * Get or create a single QR token for the user (one token per user for multi-pass support).
   * Used so one QR resolves to the user; backend fetches all passes at scan time.
   */
  static async getOrCreateUserQRToken(userId) {
    const ref = db.collection('user_qr_tokens').doc(userId)
    const doc = await ref.get()
    if (doc.exists && doc.data().qrToken) {
      return doc.data().qrToken
    }
    const qrToken = this.generateQRToken(userId, `user-${Date.now()}`)
    await ref.set({ userId, qrToken, updatedAt: new Date() }, { merge: true })
    return qrToken
  }

  static async attachPassToUser(userId, passId, paymentId) {
    try {
      const passTypeDoc = await db.collection('pass_types').doc(passId).get()
      if (!passTypeDoc.exists) {
        throw new Error('Pass type not found')
      }
      const passTypeData = passTypeDoc.data()

      const result = await db.runTransaction(async (transaction) => {
        const userTokenRef = db.collection('user_qr_tokens').doc(userId)
        const userTokenDoc = await transaction.get(userTokenRef)
        let qrToken
        if (userTokenDoc.exists && userTokenDoc.data().qrToken) {
          qrToken = userTokenDoc.data().qrToken
        } else {
          const existingPassQuery = db.collection('user_passes').where('userId', '==', userId).limit(1)
          const existingSnapshot = await transaction.get(existingPassQuery)
          if (!existingSnapshot.empty && existingSnapshot.docs[0].data().qrToken) {
            qrToken = existingSnapshot.docs[0].data().qrToken
          } else {
            qrToken = PassService.generateQRToken(userId, `user-${Date.now()}`)
          }
          transaction.set(userTokenRef, { userId, qrToken, updatedAt: new Date() }, { merge: true })
        }

        const requiresPostPaymentRegistration = !!passTypeData.requiresPostPaymentRegistration
        const userPass = {
          userId,
          passType: passId,
          paymentId,
          status: 'active',
          purchasedAt: new Date(),
          qrToken,
          maxEvents: passTypeData.maxEvents || 0,
          eventsRegistered: 0,
          allowedEventIds: passTypeData.allowedEventIds || [],
          registrationCompleted: !requiresPostPaymentRegistration,
          teamId: null
        }
        const userPassRef = db.collection('user_passes').doc()
        transaction.set(userPassRef, userPass)
        return { id: userPassRef.id, ...userPass }
      })

      return result
    } catch (error) {
      console.error('Error attaching pass to user:', error)
      throw error
    }
  }

  /**
   * Complete post-payment registration for a pass (optional flow).
   * Sets registrationCompleted: true and optionally teamId / form data. Additive only.
   */
  static async completeRegistration(userPassId, userId, data = {}) {
    const passRef = db.collection('user_passes').doc(userPassId)
    const passDoc = await passRef.get()
    if (!passDoc.exists) throw new Error('Pass not found')
    const passData = passDoc.data()
    if (passData.userId !== userId) throw new Error('Unauthorized')
    const update = {
      registrationCompleted: true,
      registrationCompletedAt: new Date(),
      updatedAt: new Date()
    }
    if (data.teamId !== undefined && data.teamId !== null) update.teamId = data.teamId
    if (data.formData && typeof data.formData === 'object') update.postPaymentFormData = data.formData
    await passRef.update(update)
    const updated = await passRef.get()
    return { id: updated.id, ...updated.data() }
  }

  static generateQRToken(userId, passId) {
    const data = `${userId}-${passId}-${Date.now()}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Resolve userId from QR token (user_passes or user_qr_tokens). Backward compatible.
   */
  static async resolveUserIdByQRToken(qrToken) {
    if (!qrToken || typeof qrToken !== 'string') return null
    const token = qrToken.trim()
    const passSnapshot = await db.collection('user_passes')
      .where('qrToken', '==', token)
      .where('status', '==', 'active')
      .limit(1)
      .get()
    if (!passSnapshot.empty) {
      return { userId: passSnapshot.docs[0].data().userId, userPassId: passSnapshot.docs[0].id, passType: passSnapshot.docs[0].data().passType }
    }
    const tokenSnapshot = await db.collection('user_qr_tokens')
      .where('qrToken', '==', token)
      .limit(1)
      .get()
    if (!tokenSnapshot.empty) {
      const d = tokenSnapshot.docs[0].data()
      return { userId: d.userId || tokenSnapshot.docs[0].id, userPassId: null, passType: null }
    }
    return null
  }

  /**
   * Verify QR token (used by volunteers to validate entry)
   * Returns user pass info + user + pass type details. Unchanged shape for backward compatibility.
   */
  static async verifyQRToken(qrToken) {
    const resolved = await this.resolveUserIdByQRToken(qrToken)
    if (!resolved) throw new Error('Invalid or expired pass')
    const { userId, userPassId, passType: resolvedPassType } = resolved
    const userDoc = await db.collection('users').doc(userId).get()
    const userData = userDoc.exists ? userDoc.data() : {}
    let passTypeData = {}
    let firstPassId = userPassId
    let passType = resolvedPassType
    if (userPassId) {
      const passDoc = await db.collection('user_passes').doc(userPassId).get()
      if (passDoc.exists) {
        const p = passDoc.data()
        passType = p.passType
        const pt = await db.collection('pass_types').doc(p.passType).get()
        passTypeData = pt.exists ? pt.data() : {}
      }
    }
    if (!passType || !passTypeData.name) {
      const firstPass = await this.getUserPass(userId)
      if (firstPass) {
        firstPassId = firstPass.id
        passType = firstPass.passType
        passTypeData = firstPass.passTypeDetails || {}
      }
    }
    const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || userData.displayName || userData.email || 'Unknown'
    return {
      userPassId: firstPassId,
      userId,
      passType: passType || '',
      userName: fullName,
      userEmail: userData.email || '',
      userPhone: userData.phone || userData.phoneNumber || '',
      userCollege: userData.college || userData.institution || '',
      passName: passTypeData.name || 'Pass',
      status: 'valid'
    }
  }

  /**
   * Verify QR token and return extended payload: activePasses, attendanceHistory, blockStatus.
   * Does not remove or alter existing response properties.
   */
  static async verifyQRTokenExtended(qrToken) {
    const base = await this.verifyQRToken(qrToken)
    const userId = base.userId
    const activePasses = await this.getUserPasses(userId)
    const activeOnly = activePasses.filter((p) => p.status === 'active').map((p) => ({
      id: p.id,
      passType: p.passType,
      passName: (p.passTypeDetails && p.passTypeDetails.name) || 'Pass',
      purchasedAt: p.purchasedAt,
      status: p.status
    }))
    const blockStatus = await this.getUserBlockStatus(userId)
    const attendanceHistory = await this.getUserAttendanceHistory(userId)
    return {
      ...base,
      activePasses: activeOnly,
      attendanceHistory,
      blockStatus
    }
  }

  static async getUserBlockStatus(userId) {
    const blockDoc = await db.collection('user_blocks').doc(userId).get()
    if (!blockDoc.exists) return { blocked: false }
    const d = blockDoc.data()
    return { blocked: !!d.blocked, reason: d.reason || null, blockedAt: d.blockedAt || null }
  }

  static async getUserAttendanceHistory(userId, limit = 50) {
    const snapshot = await db.collection('attendance')
      .where('userId', '==', userId)
      .orderBy('scannedAt', 'desc')
      .limit(limit)
      .get()
    return snapshot.docs.map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        eventId: d.eventId,
        venue: d.venue,
        status: d.status,
        scannedAt: d.scannedAt?.toDate ? d.scannedAt.toDate() : d.scannedAt
      }
    })
  }

  static async purchasePass(purchaseData) {
    try {
      const { userId, passType, paymentId, orderId, signature } = purchaseData
      
      // Verify payment (this would typically be done in payment service)
      // For now, we'll assume payment is verified
      
      // Check if user already has an active pass of this type
      const existingPassSnapshot = await db.collection('user_passes')
        .where('userId', '==', userId)
        .where('passType', '==', passType)
        .where('status', '==', 'active')
        .get()
      
      if (!existingPassSnapshot.empty) {
        throw new Error('You already have an active pass of this type')
      }
      
      // Create user pass
      const pass = {
        userId,
        passType,
        paymentId,
        orderId,
        status: 'active',
        purchasedAt: new Date(),
        validUntil: this.calculatePassExpiry(passType),
        qrCode: this.generateQRCode(userId, passType)
      }
      
      const docRef = await db.collection('user_passes').add(pass)
      
      return {
        id: docRef.id,
        ...pass
      }
    } catch (error) {
      throw error
    }
  }

  static async verifyPass(passId, userId) {
    try {
      const passDoc = await db.collection('user_passes').doc(passId).get()
      
      if (!passDoc.exists) {
        throw new Error('Pass not found')
      }
      
      const passData = passDoc.data()
      
      // Check if user owns this pass
      if (passData.userId !== userId) {
        throw new Error('Unauthorized access to pass')
      }
      
      // Check if pass is still valid
      const now = new Date()
      if (passData.validUntil.toDate() < now) {
        throw new Error('Pass has expired')
      }
      
      if (passData.status !== 'active') {
        throw new Error('Pass is not active')
      }
      
      return {
        id: passDoc.id,
        ...passData,
        isValid: true
      }
    } catch (error) {
      throw error
    }
  }

  static async generatePassQR(passId, userId) {
    try {
      const passDoc = await db.collection('user_passes').doc(passId).get()
      
      if (!passDoc.exists) {
        throw new Error('Pass not found')
      }
      
      const passData = passDoc.data()
      
      // Check if user owns this pass
      if (passData.userId !== userId) {
        throw new Error('Unauthorized access to pass')
      }
      
      // Generate QR code data
      const qrData = {
        passId,
        userId,
        passType: passData.passType,
        validUntil: passData.validUntil,
        qrCode: passData.qrCode
      }
      
      return qrData
    } catch (error) {
      throw error
    }
  }

  static generateQRCode(userId, passType) {
    // Generate a unique QR code string
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${passType}_${userId}_${timestamp}_${random}`
  }

  static calculatePassExpiry(passType) {
    const now = new Date()
    
    switch (passType) {
      case 'single_day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day
      case 'multi_day':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
      case 'vip':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
      case 'student':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day
    }
  }

  static async createPass(passData) {
    try {
      const newPass = {
        ...passData,
        active: passData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await db.collection('pass_types').add(newPass)
      
      return {
        id: docRef.id,
        ...newPass
      }
    } catch (error) {
      throw error
    }
  }

  static async updatePass(passId, updateData) {
    try {
      const passRef = db.collection('pass_types').doc(passId)
      const passDoc = await passRef.get()
      
      if (!passDoc.exists) {
        throw new Error('Pass not found')
      }
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      }
      
      await passRef.update(updatedData)
      
      const updatedDoc = await passRef.get()
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    } catch (error) {
      throw error
    }
  }

  static async getPassVersions(passId) {
    try {
      const passRef = db.collection('pass_types').doc(passId)
      const passDoc = await passRef.get()

      if (!passDoc.exists) {
        throw new Error('Pass not found')
      }

      const passData = passDoc.data()
      return [{
        id: passDoc.id,
        version: passData.currentVersion || 1,
        price: passData.price,
        maxEvents: passData.maxEvents,
        allowedEventIds: passData.allowedEventIds || [],
        createdAt: passData.updatedAt || passData.createdAt,
        ...passData
      }]
    } catch (error) {
      throw error
    }
  }

  static async deletePass(passId) {
    try {
      const passRef = db.collection('pass_types').doc(passId)
      const passDoc = await passRef.get()
      
      if (!passDoc.exists) {
        throw new Error('Pass not found')
      }
      
      // Soft delete by setting active to false
      await passRef.update({
        active: false,
        deletedAt: new Date()
      })
      
      return true
    } catch (error) {
      throw error
    }
  }
}