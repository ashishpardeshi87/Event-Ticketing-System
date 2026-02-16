import apiClient from '../client'

export const registrationService = {
  // Register for event (with full validation)
  registerForEvent: async (eventId, registrationData) => {
    const response = await apiClient.post('/registrations/register', {
      eventId,
      ...registrationData
    })
    return response.data
  },

  // Get user's registrations
  getMyRegistrations: async () => {
    const response = await apiClient.get('/registrations/my-registrations')
    return response.data
  },

  // Get registration by ID
  getRegistration: async (registrationId) => {
    const response = await apiClient.get(`/registrations/${registrationId}`)
    return response.data
  },

  // Cancel registration
  cancelRegistration: async (registrationId) => {
    const response = await apiClient.delete(`/registrations/${registrationId}`)
    return response.data
  },

  // Admin: Get all registrations
  getAllRegistrations: async (filters = {}) => {
    const response = await apiClient.get('/registrations/admin/all', { params: filters })
    return response.data
  },

  // Admin: Get registrations for event
  getEventRegistrations: async (eventId) => {
    const response = await apiClient.get(`/registrations/admin/event/${eventId}`)
    return response.data
  },

  // Admin: Manually register user
  manualRegister: async (registrationData) => {
    const response = await apiClient.post('/registrations/admin/manual-register', registrationData)
    return response.data
  },

  // Admin: Get registration stats
  getRegistrationStats: async () => {
    const response = await apiClient.get('/registrations/admin/stats')
    return response.data
  },
}
