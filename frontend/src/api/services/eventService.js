import apiClient from '../client'

export const eventService = {
  // Get all events
  getEvents: async (filters = {}) => {
    const response = await apiClient.get('/events', { params: filters })
    return response.data
  },

  // Get event by ID
  getEvent: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}`)
    return response.data
  },

  // Get user's event registrations (use registrationService instead)
  getMyRegistrations: async () => {
    const response = await apiClient.get('/events/my-registrations')
    return response.data
  },

  // Admin: Create event
  createEvent: async (eventData) => {
    const response = await apiClient.post('/events', eventData)
    return response.data
  },

  // Admin: Update event
  updateEvent: async (eventId, eventData) => {
    const response = await apiClient.put(`/events/${eventId}`, eventData)
    return response.data
  },

  // Admin: Delete event
  deleteEvent: async (eventId) => {
    const response = await apiClient.delete(`/events/${eventId}`)
    return response.data
  },

  // Admin: Toggle event active status
  toggleEventStatus: async (eventId) => {
    const response = await apiClient.post(`/events/${eventId}/toggle-status`)
    return response.data
  },

  // Admin: Update event form schema
  updateFormSchema: async (eventId, formSchema) => {
    const response = await apiClient.put(`/events/${eventId}/form-schema`, { formSchema })
    return response.data
  },
}