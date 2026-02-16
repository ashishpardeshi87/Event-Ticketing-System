import { db } from '../../config/firebase.js'
import { PassService } from '../pass/passService.js'
import { RegistrationService } from '../registration/registrationService.js'

export class AttendanceService {
  /**
   * Verify QR only - returns user details + event registrations + extended payload (no attendance recorded).
   * Extended: activePasses, attendanceHistory, blockStatus. Existing properties unchanged.
   * CRITICAL: Single QR code stores registration data - only registered events are returned.
   * Enhanced: Returns full pass details including pass type info, allowed events, purchase date, etc.
   */
  static async verifyOnly(qrToken) {
    const passInfo = await PassService.verifyQRTokenExtended(qrToken)
    const registrations = await RegistrationService.getUserRegistrations(passInfo.userId)
    
    // Get full pass details for all active passes
    const fullPassDetails = []
    if (passInfo.activePasses && passInfo.activePasses.length > 0) {
      for (const activePass of passInfo.activePasses) {
        const userPassDoc = await db.collection('user_passes').doc(activePass.id).get()
        if (userPassDoc.exists) {
          const userPassData = userPassDoc.data()
          const passTypeDoc = await db.collection('pass_types').doc(activePass.passType).get()
          const passTypeData = passTypeDoc.exists ? passTypeDoc.data() : {}
          
          fullPassDetails.push({
            id: activePass.id,
            passType: activePass.passType,
            passName: passTypeData.name || activePass.passName || 'Pass',
            passDescription: passTypeData.description || '',
            price: passTypeData.price || 0,
            maxEvents: passTypeData.maxEvents || userPassData.maxEvents || 0,
            eventsRegistered: userPassData.eventsRegistered || 0,
            allowedEventIds: passTypeData.allowedEventIds || userPassData.allowedEventIds || [],
            purchasedAt: userPassData.purchasedAt,
            status: userPassData.status || 'active',
            qrToken: userPassData.qrToken
          })
        }
      }
    }
    
    // Only return confirmed/pending registrations - these are the events user can participate in
    const activeRegistrations = registrations.filter((r) => 
      r.status === 'confirmed' || r.status === 'pending'
    )
    
    // Enrich registrations with full event details
    const enrichedRegistrations = await Promise.all(
      activeRegistrations.map(async (r) => {
        let eventDetails = null
        if (r.eventId) {
          // Passes = sub-events: read from pass_types
          const passTypeDoc = await db.collection('pass_types').doc(r.eventId).get()
          if (passTypeDoc.exists) {
            eventDetails = passTypeDoc.data()
          }
        }
        return {
          id: r.id,
          eventId: r.eventId,
          eventName: r.eventName || r.event?.name || eventDetails?.name || 'Event',
          eventDate: r.eventDate || r.event?.date || eventDetails?.date,
          eventVenue: r.eventVenue || r.event?.venue || eventDetails?.venue,
          eventCategory: eventDetails?.category || r.event?.category,
          eventDescription: eventDetails?.description || r.event?.description,
          registeredAt: r.registeredAt,
          status: r.status,
          teamId: r.teamId,
          teamName: r.team?.name
        }
      })
    )
    
    return {
      ...passInfo,
      passDetails: fullPassDetails, // Full pass details array
      registrations: enrichedRegistrations, // Enhanced registrations with event details
      // Markable events = registered events (only these can be marked)
      markableEvents: enrichedRegistrations.map(r => ({
        eventId: r.eventId,
        eventName: r.eventName,
        eventDate: r.eventDate,
        eventVenue: r.eventVenue
      }))
    }
  }

  /**
   * Scan QR token, validate pass, and create attendance record.
   * Enforces: block check, volunteer assignment (events + optional passes), registration check, one attendance per user per event.
   * CRITICAL: User must be registered for the event to participate.
   */
  static async scanAndRecord(qrToken, volunteerId, venue = '', eventId = '', status = 'present') {
    const passInfo = await PassService.verifyQRToken(qrToken)
    const volunteerDoc = await db.collection('users').doc(volunteerId).get()
    const volunteerData = volunteerDoc.exists ? volunteerDoc.data() : {}
    const assignedEventIds = volunteerData.assignedEventIds || []
    const assignedPassIds = volunteerData.assignedPassIds || []
    if (assignedEventIds.length > 0 && eventId && !assignedEventIds.includes(eventId)) {
      throw new Error('You are not assigned to mark attendance for this event')
    }
    if (assignedPassIds.length > 0) {
      const userPasses = await PassService.getUserPasses(passInfo.userId)
      const userPassTypes = userPasses.filter((p) => p.status === 'active').map((p) => p.passType)
      const allowed = assignedPassIds.some((pid) => userPassTypes.includes(pid))
      if (!allowed) {
        throw new Error('You are not assigned to scan this pass type')
      }
    }
    const blockStatus = await PassService.getUserBlockStatus(passInfo.userId)
    if (blockStatus.blocked) {
      throw new Error(blockStatus.reason || 'This attendee is blocked from attendance marking')
    }
    
    // CRITICAL: Check if user is registered for this event
    if (eventId) {
      const registrationCheck = await db.collection('registrations')
        .where('userId', '==', passInfo.userId)
        .where('eventId', '==', eventId)
        .where('status', 'in', ['confirmed', 'pending'])
        .limit(1)
        .get()
      
      if (registrationCheck.empty) {
        throw new Error('User is not registered for this sub-event. Registration is required to participate.')
      }
    }
    
    const result = await db.runTransaction(async (transaction) => {
      if (eventId) {
        const existingQuery = db.collection('attendance')
          .where('userId', '==', passInfo.userId)
          .where('eventId', '==', eventId)
          .limit(1)
        const existingSnap = await transaction.get(existingQuery)
        if (!existingSnap.empty) {
          throw new Error('Attendance already recorded for this user for this event')
        }
      }
      // Get full pass details for admin records
      const userPasses = await PassService.getUserPasses(passInfo.userId)
      const activePasses = userPasses.filter((p) => p.status === 'active')
      const passDetails = activePasses.map((p) => ({
        passType: p.passType,
        passName: (p.passTypeDetails && p.passTypeDetails.name) || 'Pass',
        purchasedAt: p.purchasedAt
      }))
      
      const attendance = {
        userId: passInfo.userId,
        userPassId: passInfo.userPassId,
        userName: passInfo.userName,
        userEmail: passInfo.userEmail,
        userPhone: passInfo.userPhone || '',
        userCollege: passInfo.userCollege || '',
        passName: passInfo.passName,
        passType: passInfo.passType,
        passDetails: passDetails, // Store all pass details for admin
        venue: venue || 'General',
        eventId: eventId || '',
        eventName: '', // Will be populated if eventId exists
        status: status === 'absent' ? 'absent' : 'present',
        scannedBy: volunteerId,
        scannedAt: new Date()
      }
      
      // Get pass/sub-event name if eventId provided (passes = sub-events)
      if (eventId) {
        const passTypeDoc = await db.collection('pass_types').doc(eventId).get()
        if (passTypeDoc.exists) {
          attendance.eventName = passTypeDoc.data().name || ''
        }
      }
      const docRef = db.collection('attendance').doc()
      transaction.set(docRef, attendance)
      return { id: docRef.id, ...attendance }
    })
    return {
      ...result,
      success: true,
      message: status === 'present' ? 'Entry validated successfully' : 'Marked as absent'
    }
  }

  static async getAllAttendance(filters = {}) {
    let query = db.collection('attendance').orderBy('scannedAt', 'desc')
    if (filters.eventId) {
      query = query.where('eventId', '==', filters.eventId)
    }
    if (filters.venue) {
      query = query.where('venue', '==', filters.venue)
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status)
    }
    if (filters.scannedBy) {
      query = query.where('scannedBy', '==', filters.scannedBy)
    }
    const limit = Math.min(parseInt(filters.limit) || 500, 1000)
    query = query.limit(limit)
    const snapshot = await query.get()
    const list = []
    snapshot.forEach(doc => {
      const d = doc.data()
      list.push({
        id: doc.id,
        ...d,
        scannedAt: d.scannedAt?.toDate ? d.scannedAt.toDate() : d.scannedAt
      })
    })
    return list
  }

  static async getVolunteerAttendance(volunteerId, filters = {}) {
    return this.getAllAttendance({ ...filters, scannedBy: volunteerId })
  }

  static async getAttendanceByEvent(eventId) {
    const snapshot = await db.collection('attendance')
      .where('eventId', '==', eventId)
      .orderBy('scannedAt', 'desc')
      .get()
    const list = []
    snapshot.forEach(doc => {
      const d = doc.data()
      list.push({
        id: doc.id,
        ...d,
        scannedAt: d.scannedAt?.toDate ? d.scannedAt.toDate() : d.scannedAt
      })
    })
    return list
  }

  static async getAttendanceStats() {
    const snapshot = await db.collection('attendance').get()
    let present = 0
    let absent = 0
    const byVenue = {}
    snapshot.forEach(doc => {
      const d = doc.data()
      if (d.status === 'present') present++
      else absent++
      const v = d.venue || 'General'
      byVenue[v] = (byVenue[v] || 0) + 1
    })
    return {
      total: snapshot.size,
      present,
      absent,
      byVenue
    }
  }
}
