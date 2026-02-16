import { db } from '../../config/firebase.js'

export class EventService {
  static async getEvents(filters = {}) {
    try {
      let query = db.collection('events')
      
      // Apply single filter to avoid index requirements
      if (filters.category) {
        query = query.where('category', '==', filters.category)
      } else if (filters.status) {
        query = query.where('status', '==', filters.status)
      }
      
      // Apply limit if specified
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit))
      }
      
      const snapshot = await query.get()
      let events = []
      
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      // Client-side filtering for additional filters
      if (filters.date) {
        const filterDate = new Date(filters.date)
        events = events.filter(e => e.date && new Date(e.date) >= filterDate)
      }
      
      // Client-side sorting
      events.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0)
        const dateB = b.date ? new Date(b.date) : new Date(0)
        return dateA - dateB
      })
      
      return events
    } catch (error) {
      console.error('[EventService.getEvents] Error:', error.message)
      return []
    }
  }

  static async getEvent(eventId) {
    try {
      const eventDoc = await db.collection('events').doc(eventId).get()
      
      if (!eventDoc.exists) {
        throw new Error('Event not found')
      }
      
      return {
        id: eventDoc.id,
        ...eventDoc.data()
      }
    } catch (error) {
      throw error
    }
  }

  static async createEvent(eventData) {
    try {
      const newEvent = {
        ...eventData,
        status: 'open',
        registeredCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await db.collection('events').add(newEvent)
      
      return {
        id: docRef.id,
        ...newEvent
      }
    } catch (error) {
      throw error
    }
  }

  static async updateEvent(eventId, updateData) {
    try {
      const eventRef = db.collection('events').doc(eventId)
      const eventDoc = await eventRef.get()
      
      if (!eventDoc.exists) {
        throw new Error('Event not found')
      }
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      }
      
      await eventRef.update(updatedData)
      
      const updatedDoc = await eventRef.get()
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    } catch (error) {
      throw error
    }
  }

  static async deleteEvent(eventId) {
    try {
      const eventRef = db.collection('events').doc(eventId)
      const eventDoc = await eventRef.get()
      
      if (!eventDoc.exists) {
        throw new Error('Event not found')
      }
      
      // Check if there are any registrations
      const registrationsSnapshot = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .get()
      
      if (!registrationsSnapshot.empty) {
        throw new Error('Cannot delete event with existing registrations')
      }
      
      await eventRef.delete()
      return true
    } catch (error) {
      throw error
    }
  }

  static async registerForEvent(registrationData) {
    try {
      const { eventId, userId } = registrationData
      
      // Check if event exists and is open
      const eventDoc = await db.collection('events').doc(eventId).get()
      if (!eventDoc.exists) {
        throw new Error('Event not found')
      }
      
      const eventData = eventDoc.data()
      if (eventData.status !== 'open') {
        throw new Error('Event registration is closed')
      }
      
      // Check if user is already registered
      const existingRegistration = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .where('userId', '==', userId)
        .get()
      
      if (!existingRegistration.empty) {
        throw new Error('Already registered for this event')
      }
      
      // Check capacity
      if (eventData.registeredCount >= eventData.maxParticipants) {
        throw new Error('Event is full')
      }
      
      // Create registration
      const registration = {
        ...registrationData,
        status: 'confirmed',
        registeredAt: new Date()
      }
      
      const docRef = await db.collection('registrations').add(registration)
      
      // Update event registered count
      await db.collection('events').doc(eventId).update({
        registeredCount: eventData.registeredCount + 1
      })
      
      return {
        id: docRef.id,
        ...registration
      }
    } catch (error) {
      throw error
    }
  }

  static async getUserRegistrations(userId) {
    try {
      const snapshot = await db.collection('registrations')
        .where('userId', '==', userId)
        .orderBy('registeredAt', 'desc')
        .get()
      
      const registrations = []
      
      for (const doc of snapshot.docs) {
        const registrationData = doc.data()
        
        // Get event details
        const eventDoc = await db.collection('events').doc(registrationData.eventId).get()
        const eventData = eventDoc.exists ? eventDoc.data() : null
        
        registrations.push({
          id: doc.id,
          ...registrationData,
          event: eventData,
          eventName: eventData?.name,
          eventDate: eventData?.date,
          eventVenue: eventData?.venue
        })
      }
      
      return registrations
    } catch (error) {
      throw error
    }
  }

  static async cancelRegistration(registrationId, userId) {
    try {
      const registrationRef = db.collection('registrations').doc(registrationId)
      const registrationDoc = await registrationRef.get()
      
      if (!registrationDoc.exists) {
        throw new Error('Registration not found')
      }
      
      const registrationData = registrationDoc.data()
      
      // Check if user owns this registration
      if (registrationData.userId !== userId) {
        throw new Error('Unauthorized to cancel this registration')
      }
      
      // Delete registration
      await registrationRef.delete()
      
      // Update event registered count
      const eventRef = db.collection('events').doc(registrationData.eventId)
      const eventDoc = await eventRef.get()
      
      if (eventDoc.exists) {
        const eventData = eventDoc.data()
        await eventRef.update({
          registeredCount: Math.max(0, eventData.registeredCount - 1)
        })
      }
      
      return true
    } catch (error) {
      throw error
    }
  }

  static async getEventRegistrations(eventId) {
    try {
      const snapshot = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .orderBy('registeredAt', 'desc')
        .get()
      
      const registrations = []
      
      for (const doc of snapshot.docs) {
        const registrationData = doc.data()
        
        // Get user details
        const userDoc = await db.collection('users').doc(registrationData.userId).get()
        const userData = userDoc.exists ? userDoc.data() : null
        
        registrations.push({
          id: doc.id,
          ...registrationData,
          user: userData
        })
      }
      
      return registrations
    } catch (error) {
      throw error
    }
  }
}