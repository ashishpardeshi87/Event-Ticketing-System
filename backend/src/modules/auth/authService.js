import { auth, db } from '../../config/firebase.js'

/** Attach statusCode to Error for the global error handler */
function authError(message, statusCode = 500) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

export class AuthService {
  /**
   * Ensures a user document exists in Firestore (creates from Auth if missing).
   * Use this when client-side write may have failed (e.g. Firestore rules before fix).
   */
  static async ensureUserDocument(uid) {
    const userRef = db.collection('users').doc(uid)
    let userDoc
    try {
      userDoc = await userRef.get()
    } catch (e) {
      console.error('[AuthService.ensureUserDocument] Firestore get failed:', e?.code ?? e?.message ?? e)
      throw authError('Database unavailable', 503)
    }
    if (userDoc.exists) return userDoc.data()

    let userRecord
    try {
      userRecord = await auth.getUser(uid)
    } catch (e) {
      const code = e?.code || e?.errorInfo?.code
      console.error('[AuthService.ensureUserDocument] auth.getUser failed:', code, e?.message ?? e)
      if (code === 'auth/user-not-found') throw authError('User not found', 404)
      throw authError('Authentication service error', 503)
    }

    const userData = {
      email: userRecord.email || '',
      displayName: userRecord.displayName || '',
      photoURL: userRecord.photoURL || '',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    try {
      await userRef.set(userData)
    } catch (e) {
      console.error('[AuthService.ensureUserDocument] Firestore set failed:', e?.code ?? e?.message ?? e)
      throw authError('Database write failed', 503)
    }
    return userData
  }

  static async verifyToken(token) {
    try {
      const decodedToken = await auth.verifyIdToken(token)
      
      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(decodedToken.uid).get()
      const userData = userDoc.exists ? userDoc.data() : null
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        ...userData
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  static async getProfile(uid) {
    let userDoc
    try {
      userDoc = await db.collection('users').doc(uid).get()
    } catch (e) {
      console.error('[AuthService.getProfile] Firestore get failed:', e?.code ?? e?.message ?? e)
      throw authError('Database unavailable', 503)
    }

    if (!userDoc.exists) {
      // User exists in Auth but not in Firestore (e.g. client write failed or offline).
      // Create the document from Auth so the app works.
      return await AuthService.ensureUserDocument(uid)
    }

    return userDoc.data()
  }

  /** Allowed profile fields only; role, payment, attendance, and system fields are never updated via profile. */
  static ALLOWED_PROFILE_FIELDS = [
    'firstName', 'lastName', 'displayName', 'photoURL', 'phone', 'phoneNumber',
    'college', 'institution'
  ]

  static async updateProfile(uid, profileData) {
    try {
      const filtered = {}
      for (const key of AuthService.ALLOWED_PROFILE_FIELDS) {
        if (profileData[key] !== undefined) filtered[key] = profileData[key]
      }
      filtered.updatedAt = new Date()

      await db.collection('users').doc(uid).update(filtered)

      const updatedDoc = await db.collection('users').doc(uid).get()
      return updatedDoc.data()
    } catch (error) {
      throw error
    }
  }

  /**
   * Profile hub: aggregated identity and activity for the user.
   * All data from existing collections; no restructuring. QR is single token resolved at scan time.
   */
  static async getProfileHub(uid) {
    const profile = await AuthService.getProfile(uid)
    const { PassService } = await import('../pass/passService.js')
    const { RegistrationService } = await import('../registration/registrationService.js')
    const { TeamService } = await import('../team/teamService.js')
    const { PaymentService } = await import('../payment/paymentService.js')

    const [passes, registrations, teams, payments, attendance] = await Promise.all([
      PassService.getUserPasses(uid),
      RegistrationService.getUserRegistrations(uid),
      TeamService.getUserTeams(uid),
      PaymentService.getPaymentHistory(uid),
      PassService.getUserAttendanceHistory(uid, 50)
    ])

    let qrToken = null
    const activePass = passes.find((p) => p.status === 'active')
    if (activePass?.qrToken) qrToken = activePass.qrToken
    if (!qrToken) {
      const tokenDoc = await db.collection('user_qr_tokens').doc(uid).get()
      if (tokenDoc.exists && tokenDoc.data().qrToken) qrToken = tokenDoc.data().qrToken
    }

    return {
      profile,
      passes,
      registrations,
      teams,
      payments,
      attendance,
      qrToken
    }
  }

  static async deleteAccount(uid) {
    try {
      // Delete user document from Firestore
      await db.collection('users').doc(uid).delete()
      
      // Delete user from Firebase Auth
      await auth.deleteUser(uid)
      
      return true
    } catch (error) {
      throw error
    }
  }

  static async createUserDocument(uid, userData) {
    try {
      const userRef = db.collection('users').doc(uid)
      const userDoc = await userRef.get()
      
      if (!userDoc.exists) {
        const newUser = {
          uid,
          email: userData.email,
          displayName: userData.displayName || '',
          photoURL: userData.photoURL || '',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...userData
        }
        
        await userRef.set(newUser)
        return newUser
      }
      
      return userDoc.data()
    } catch (error) {
      throw error
    }
  }
}