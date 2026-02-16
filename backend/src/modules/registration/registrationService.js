import { db } from '../../config/firebase.js'
import { PassService } from '../pass/passService.js'
import { TeamService } from '../team/teamService.js'

/**
 * REGISTRATION ENGINE
 * Enforces all business rules:
 * - User must have valid pass
 * - Event must be in pass allowedEventIds
 * - User must not exceed maxEvents
 * - Team must be complete (for team events)
 * - No duplicate registrations
 * - Event must not be full
 */

export class RegistrationService {
  
  /**
   * Register user for event (solo or team)
   * Enforces ALL validation rules
   */
  static async registerForEvent(registrationData, userId) {
    try {
      const { eventId, teamId, formData } = registrationData
      
      // Passes = sub-events: read from pass_types
      const passTypeDoc = await db.collection('pass_types').doc(eventId).get()
      
      if (!passTypeDoc.exists) {
        throw new Error('Pass/sub-event not found')
      }
      
      const eventData = passTypeDoc.data()
      
      // Check if pass/sub-event is active
      if (eventData.active === false || eventData.isActive === false) {
        throw new Error('Sub-event registration is closed')
      }
      
      // RULE 1: Validate user's pass
      const passValidation = await PassService.validatePassForEvent(userId, eventId)
      
      if (!passValidation.valid) {
        throw new Error(passValidation.reason)
      }
      
      // RULE 2: Check for duplicate registration
      const existingReg = await db.collection('registrations')
        .where('userId', '==', userId)
        .where('eventId', '==', eventId)
        .where('status', 'in', ['confirmed', 'pending'])
        .get()
      
      if (!existingReg.empty) {
        throw new Error('You are already registered for this sub-event')
      }
      
      // RULE 3: For team events, validate team
      if (eventData.maxTeamSize > 1) {
        if (!teamId) {
          throw new Error('This is a team event. Please create or join a team first')
        }
        
        // Validate team
        const teamValidation = await TeamService.validateTeamForRegistration(teamId)
        
        if (!teamValidation.valid) {
          throw new Error(teamValidation.reason)
        }
        
        // Lock the team
        await TeamService.lockTeam(teamId)
      }
      
      // RULE 4: Validate form data against event schema
      if (eventData.formSchema) {
        const formValidation = this.validateFormData(formData, eventData.formSchema)
        
        if (!formValidation.valid) {
          throw new Error(`Form validation failed: ${formValidation.errors.join(', ')}`)
        }
      }
      
      // RULE 5: Check if event has reached max capacity
      if (eventData.maxTeamSize > 1) {
        // Team event - check team count
        if (eventData.teamCount >= eventData.maxTeams) {
          throw new Error('Event has reached maximum team capacity')
        }
      } else {
        // Solo event - check participant count
        const participantCount = await this.getEventParticipantCount(eventId)
        
        if (participantCount >= eventData.maxParticipants) {
          throw new Error('Event has reached maximum participant capacity')
        }
      }
      
      // Use Firestore transaction to prevent race conditions
      const registration = await db.runTransaction(async (transaction) => {
        // Create registration
        const regRef = db.collection('registrations').doc()
        
        const registrationDoc = {
          userId,
          eventId,
          teamId: teamId || null,
          formData: formData || {},
          status: 'confirmed',
          registeredAt: new Date(),
          createdAt: new Date()
        }
        
        transaction.set(regRef, registrationDoc)
        
        // Increment eventsRegistered on user's pass
        const userPassQuery = db.collection('user_passes')
          .where('userId', '==', userId)
          .where('status', '==', 'active')
          .limit(1)
        const userPassSnapshot = await transaction.get(userPassQuery)
        if (!userPassSnapshot.empty) {
          const userPassRef = userPassSnapshot.docs[0].ref
          const userPassData = userPassSnapshot.docs[0].data()
          const currentCount = userPassData.eventsRegistered || 0
          transaction.update(userPassRef, { eventsRegistered: currentCount + 1 })
        }
        
        // Update count on pass_types (passes = sub-events)
        const eventRef = db.collection('pass_types').doc(eventId)
        
        if (eventData.maxTeamSize > 1 && teamId) {
          // Increment team count (only once per team, not per member)
          const teamRegExists = await db.collection('registrations')
            .where('eventId', '==', eventId)
            .where('teamId', '==', teamId)
            .limit(1)
            .get()
          
          if (teamRegExists.empty) {
            transaction.update(eventRef, {
              teamCount: (eventData.teamCount || 0) + 1,
              updatedAt: new Date()
            })
          }
        }
        
        return {
          id: regRef.id,
          ...registrationDoc
        }
      })
      
      return registration
    } catch (error) {
      console.error('[RegistrationService.registerForEvent] Error:', error.message)
      throw error
    }
  }

  /**
   * Cancel registration
   * Unlocks team if team event
   */
  static async cancelRegistration(registrationId, userId) {
    try {
      const regDoc = await db.collection('registrations').doc(registrationId).get()
      
      if (!regDoc.exists) {
        throw new Error('Registration not found')
      }
      
      const regData = regDoc.data()
      
      // Verify user owns this registration
      if (regData.userId !== userId) {
        throw new Error('Unauthorized to cancel this registration')
      }
      
      // Check if cancellation is allowed
      if (regData.status === 'cancelled') {
        throw new Error('Registration is already cancelled')
      }
      
      // Get pass_types details (passes = sub-events)
      const passTypeDoc = await db.collection('pass_types').doc(regData.eventId).get()
      const eventData = passTypeDoc.exists ? passTypeDoc.data() : null
      
      // Use transaction to ensure consistency
      await db.runTransaction(async (transaction) => {
        // Update registration status
        transaction.update(regDoc.ref, {
          status: 'cancelled',
          cancelledAt: new Date()
        })
        
        // Decrement eventsRegistered on user's pass
        const userPassQuery = db.collection('user_passes')
          .where('userId', '==', regData.userId)
          .where('status', '==', 'active')
          .limit(1)
        const userPassSnapshot = await transaction.get(userPassQuery)
        if (!userPassSnapshot.empty) {
          const userPassRef = userPassSnapshot.docs[0].ref
          const userPassData = userPassSnapshot.docs[0].data()
          const currentCount = Math.max(0, (userPassData.eventsRegistered || 0) - 1)
          transaction.update(userPassRef, { eventsRegistered: currentCount })
        }
        
        // If team event, unlock team
        if (regData.teamId) {
          const teamRef = db.collection('teams').doc(regData.teamId)
          transaction.update(teamRef, {
            state: TeamService.TEAM_STATES.COMPLETE,
            updatedAt: new Date()
          })
          
          // Decrement team count on pass_types
          if (eventData) {
            const passTypeRef = db.collection('pass_types').doc(regData.eventId)
            transaction.update(passTypeRef, {
              teamCount: Math.max(0, (eventData.teamCount || 0) - 1),
              updatedAt: new Date()
            })
          }
        }
      })
      
      return { success: true }
    } catch (error) {
      console.error('[RegistrationService.cancelRegistration] Error:', error.message)
      throw error
    }
  }

  /**
   * Get user's registrations
   */
  static async getUserRegistrations(userId) {
    try {
      const snapshot = await db.collection('registrations')
        .where('userId', '==', userId)
        .where('status', '==', 'confirmed')
        .get()
      
      const registrations = []
      
      for (const doc of snapshot.docs) {
        const regData = doc.data()
        
        // Get pass_types details (passes = sub-events)
        const passTypeDoc = await db.collection('pass_types').doc(regData.eventId).get()
        const passTypeData = passTypeDoc.exists ? passTypeDoc.data() : null
        
        // Get team details if team event
        let teamData = null
        if (regData.teamId) {
          const teamDoc = await db.collection('teams').doc(regData.teamId).get()
          teamData = teamDoc.exists ? teamDoc.data() : null
        }
        
        registrations.push({
          id: doc.id,
          ...regData,
          event: passTypeData,
          team: teamData,
          eventName: passTypeData?.name,
          eventDate: passTypeData?.date,
          eventVenue: passTypeData?.venue
        })
      }
      
      // Sort by registration date (newest first)
      registrations.sort((a, b) => {
        const dateA = a.registeredAt?.toDate?.() || new Date(0)
        const dateB = b.registeredAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
      
      return registrations
    } catch (error) {
      console.error('[RegistrationService.getUserRegistrations] Error:', error.message)
      return []
    }
  }

  /**
   * Get event registrations (admin)
   */
  static async getEventRegistrations(eventId) {
    try {
      const snapshot = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .where('status', '==', 'confirmed')
        .get()
      
      const registrations = []
      
      for (const doc of snapshot.docs) {
        const regData = doc.data()
        
        // Get user details
        const userDoc = await db.collection('users').doc(regData.userId).get()
        const userData = userDoc.exists ? userDoc.data() : null
        
        // Get team details if applicable
        let teamData = null
        if (regData.teamId) {
          teamData = await TeamService.getTeam(regData.teamId)
        }
        
        registrations.push({
          id: doc.id,
          ...regData,
          user: {
            id: regData.userId,
            name: userData?.displayName || userData?.firstName,
            email: userData?.email,
            mobile: userData?.mobile
          },
          team: teamData
        })
      }
      
      return registrations
    } catch (error) {
      console.error('[RegistrationService.getEventRegistrations] Error:', error.message)
      return []
    }
  }

  /**
   * Validate form data against schema
   */
  static validateFormData(formData, formSchema) {
    const errors = []
    
    if (!formSchema || !Array.isArray(formSchema)) {
      return { valid: true }
    }
    
    for (const field of formSchema) {
      const { name, type, required, label } = field
      const value = formData[name]
      
      // Check required fields
      if (required && (!value || value === '')) {
        errors.push(`${label || name} is required`)
        continue
      }
      
      // Skip validation if field is not required and empty
      if (!required && (!value || value === '')) {
        continue
      }
      
      // Type-specific validation
      switch (type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`${label || name} must be a valid email`)
          }
          break
        
        case 'number':
          if (isNaN(value)) {
            errors.push(`${label || name} must be a number`)
          }
          break
        
        case 'phone':
          if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
            errors.push(`${label || name} must be a valid phone number`)
          }
          break
        
        case 'url':
          try {
            new URL(value)
          } catch {
            errors.push(`${label || name} must be a valid URL`)
          }
          break
      }
      
      // Min/max validation for numbers
      if (type === 'number') {
        const numValue = parseFloat(value)
        if (field.min !== undefined && numValue < field.min) {
          errors.push(`${label || name} must be at least ${field.min}`)
        }
        if (field.max !== undefined && numValue > field.max) {
          errors.push(`${label || name} must be at most ${field.max}`)
        }
      }
      
      // Length validation for text
      if (type === 'text' || type === 'textarea') {
        if (field.minLength && value.length < field.minLength) {
          errors.push(`${label || name} must be at least ${field.minLength} characters`)
        }
        if (field.maxLength && value.length > field.maxLength) {
          errors.push(`${label || name} must be at most ${field.maxLength} characters`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get event participant count
   */
  static async getEventParticipantCount(eventId) {
    try {
      const snapshot = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .where('status', '==', 'confirmed')
        .get()
      
      return snapshot.size
    } catch (error) {
      console.error('[RegistrationService.getEventParticipantCount] Error:', error.message)
      return 0
    }
  }

  /**
   * Check if user can register for event
   * Returns detailed validation result
   */
  static async canUserRegister(userId, eventId) {
    try {
      // Check pass
      const passValidation = await PassService.validatePassForEvent(userId, eventId)
      
      if (!passValidation.valid) {
        return {
          canRegister: false,
          reason: passValidation.reason,
          checks: {
            hasPass: false,
            eventAllowed: false,
            withinLimit: false
          }
        }
      }
      
      // Check duplicate
      const existingReg = await db.collection('registrations')
        .where('userId', '==', userId)
        .where('eventId', '==', eventId)
        .where('status', 'in', ['confirmed', 'pending'])
        .get()
      
      if (!existingReg.empty) {
        return {
          canRegister: false,
          reason: 'Already registered',
          checks: {
            hasPass: true,
            eventAllowed: true,
            withinLimit: true,
            notDuplicate: false
          }
        }
      }
      
      // Check pass_types capacity (passes = sub-events)
      const passTypeDoc = await db.collection('pass_types').doc(eventId).get()
      
      if (!passTypeDoc.exists) {
        return {
          canRegister: false,
          reason: 'Pass/sub-event not found'
        }
      }
      
      const eventData = passTypeDoc.data()
      
      if (eventData.active === false || eventData.isActive === false) {
        return {
          canRegister: false,
          reason: 'This pass/sub-event is not active'
        }
      }
      
      // Check capacity
      if (eventData.maxTeamSize > 1) {
        if (eventData.teamCount >= eventData.maxTeams) {
          return {
            canRegister: false,
            reason: 'Event is full',
            checks: {
              hasPass: true,
              eventAllowed: true,
              withinLimit: true,
              notDuplicate: true,
              hasCapacity: false
            }
          }
        }
      } else {
        const participantCount = await this.getEventParticipantCount(eventId)
        
        if (participantCount >= eventData.maxParticipants) {
          return {
            canRegister: false,
            reason: 'Event is full',
            checks: {
              hasPass: true,
              eventAllowed: true,
              withinLimit: true,
              notDuplicate: true,
              hasCapacity: false
            }
          }
        }
      }
      
      return {
        canRegister: true,
        checks: {
          hasPass: true,
          eventAllowed: true,
          withinLimit: true,
          notDuplicate: true,
          hasCapacity: true
        },
        eventsRemaining: passValidation.eventsRemaining
      }
    } catch (error) {
      console.error('[RegistrationService.canUserRegister] Error:', error.message)
      return {
        canRegister: false,
        reason: 'Error checking registration eligibility'
      }
    }
  }

  /**
   * Get all registrations with filters (admin)
   */
  static async getAllRegistrations(filters = {}) {
    try {
      let query = db.collection('registrations')
      
      // Apply filters
      if (filters.eventId) {
        query = query.where('eventId', '==', filters.eventId)
      }
      
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId)
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get()
      
      const registrations = []
      for (const doc of snapshot.docs) {
        const data = doc.data()
        
        // Fetch user details
        let userName = 'Unknown'
        let userEmail = 'N/A'
        try {
          const userDoc = await db.collection('users').doc(data.userId).get()
          if (userDoc.exists) {
            const userData = userDoc.data()
            userName = userData.displayName || userData.firstName || 'Unknown'
            userEmail = userData.email || 'N/A'
          }
        } catch (err) {
          console.error('Error fetching user:', err)
        }
        
        // Fetch pass_types details (passes = sub-events)
        let eventName = 'Unknown'
        try {
          const passTypeDoc = await db.collection('pass_types').doc(data.eventId).get()
          if (passTypeDoc.exists) {
            eventName = passTypeDoc.data().name
          }
        } catch (err) {
          console.error('Error fetching pass type:', err)
        }
        
        // Fetch team details if applicable
        let teamName = null
        if (data.teamId) {
          try {
            const teamDoc = await db.collection('teams').doc(data.teamId).get()
            if (teamDoc.exists) {
              teamName = teamDoc.data().name
            }
          } catch (err) {
            console.error('Error fetching team:', err)
          }
        }
        
        registrations.push({
          id: doc.id,
          ...data,
          userName,
          userEmail,
          eventName,
          teamName
        })
      }
      
      return registrations
    } catch (error) {
      console.error('Error getting all registrations:', error)
      throw new Error('Failed to fetch registrations')
    }
  }

  /**
   * Manual registration (admin override)
   */
  static async manualRegister(registrationData) {
    try {
      const { userId, eventId, teamId, formData } = registrationData
      
      // Check for duplicate
      const existingReg = await db.collection('registrations')
        .where('userId', '==', userId)
        .where('eventId', '==', eventId)
        .get()
      
      if (!existingReg.empty) {
        throw new Error('User already registered for this event')
      }
      
      // Create registration (bypassing normal validation)
      const registration = {
        userId,
        eventId,
        teamId: teamId || null,
        formData: formData || {},
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manualOverride: true
      }
      
      const docRef = await db.collection('registrations').add(registration)
      
      return {
        id: docRef.id,
        ...registration
      }
    } catch (error) {
      console.error('Error in manual registration:', error)
      throw error
    }
  }

  /**
   * Get registration statistics (admin)
   */
  static async getRegistrationStats() {
    try {
      const snapshot = await db.collection('registrations').get()
      
      const stats = {
        total: snapshot.size,
        byEvent: {},
        byUser: {}
      }
      
      snapshot.forEach(doc => {
        const data = doc.data()
        
        // Count by event
        if (!stats.byEvent[data.eventId]) {
          stats.byEvent[data.eventId] = 0
        }
        stats.byEvent[data.eventId]++
        
        // Count by user
        if (!stats.byUser[data.userId]) {
          stats.byUser[data.userId] = 0
        }
        stats.byUser[data.userId]++
      })
      
      return stats
    } catch (error) {
      console.error('Error getting registration stats:', error)
      throw new Error('Failed to fetch registration statistics')
    }
  }
}
