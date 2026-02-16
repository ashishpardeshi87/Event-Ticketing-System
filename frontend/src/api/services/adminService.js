import apiClient from '../client'

export const adminService = {
  // Dashboard stats
  getStats: async () => {
    const response = await apiClient.get('/admin/stats')
    return response.data
  },

  getAnalytics: async (period = '30d') => {
    const response = await apiClient.get(`/admin/analytics?period=${period}`)
    return response.data
  },

  // User management
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await apiClient.get(`/admin/users${params ? `?${params}` : ''}`)
    return response.data
  },

  getUser: async (userId) => {
    const response = await apiClient.get(`/admin/users/${userId}`)
    return response.data
  },

  updateUser: async (userId, data) => {
    const response = await apiClient.put(`/admin/users/${userId}`, data)
    return response.data
  },

  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/admin/users/${userId}`)
    return response.data
  },

  setAdminRole: async (userId) => {
    const response = await apiClient.post(`/admin/users/${userId}/set-admin`)
    return response.data
  },

  removeAdminRole: async (userId) => {
    const response = await apiClient.post(`/admin/users/${userId}/remove-admin`)
    return response.data
  },

  setVolunteerRole: async (userId) => {
    const response = await apiClient.post(`/admin/users/${userId}/set-volunteer`)
    return response.data
  },

  removeVolunteerRole: async (userId) => {
    const response = await apiClient.post(`/admin/users/${userId}/remove-volunteer`)
    return response.data
  },

  assignVolunteerToEvents: async (userId, eventIds) => {
    const response = await apiClient.put(`/admin/users/${userId}/volunteer-events`, { eventIds })
    return response.data
  },

  // Pass management
  getAllPasses: async () => {
    const response = await apiClient.get('/passes')
    return response.data
  },

  createPass: async (passData) => {
    const response = await apiClient.post('/passes', passData)
    return response.data
  },

  updatePass: async (passId, passData) => {
    const response = await apiClient.put(`/passes/${passId}`, passData)
    return response.data
  },

  deletePass: async (passId) => {
    const response = await apiClient.delete(`/passes/${passId}`)
    return response.data
  },

  getPassVersions: async (passId) => {
    const response = await apiClient.get(`/passes/${passId}/versions`)
    return response.data
  },

  // Event management
  getAllEvents: async () => {
    const response = await apiClient.get('/events')
    return response.data
  },

  createEvent: async (eventData) => {
    const response = await apiClient.post('/events', eventData)
    return response.data
  },

  updateEvent: async (eventId, eventData) => {
    const response = await apiClient.put(`/events/${eventId}`, eventData)
    return response.data
  },

  deleteEvent: async (eventId) => {
    const response = await apiClient.delete(`/events/${eventId}`)
    return response.data
  },

  toggleEventStatus: async (eventId) => {
    const response = await apiClient.post(`/events/${eventId}/toggle-status`)
    return response.data
  },

  updateFormSchema: async (eventId, formSchema) => {
    const response = await apiClient.put(`/events/${eventId}/form-schema`, { formSchema })
    return response.data
  },

  // Team management
  getAllTeams: async (filters = {}) => {
    const response = await apiClient.get('/teams/admin/all', { params: filters })
    return response.data
  },

  forceLockTeam: async (teamId) => {
    const response = await apiClient.post(`/teams/${teamId}/force-lock`)
    return response.data
  },

  deleteTeam: async (teamId) => {
    const response = await apiClient.delete(`/teams/${teamId}`)
    return response.data
  },

  // Registration management
  getAllRegistrations: async (filters = {}) => {
    const response = await apiClient.get('/registrations/admin/all', { params: filters })
    return response.data
  },

  getEventRegistrations: async (eventId) => {
    const response = await apiClient.get(`/registrations/admin/event/${eventId}`)
    return response.data
  },

  manualRegister: async (registrationData) => {
    const response = await apiClient.post('/registrations/admin/manual-register', registrationData)
    return response.data
  },

  getRegistrationStats: async () => {
    const response = await apiClient.get('/registrations/admin/stats')
    return response.data
  },

  // Payment management
  getAllPayments: async (filters = {}) => {
    const response = await apiClient.get('/payments/admin/all', { params: filters })
    return response.data
  },

  getPaymentStats: async () => {
    const response = await apiClient.get('/payments/admin/stats')
    return response.data
  },

  // System management
  getSystemHealth: async () => {
    const response = await apiClient.get('/admin/system/health')
    return response.data
  },

  getSystemLogs: async (limit = 100, level = 'all') => {
    const response = await apiClient.get(`/admin/system/logs?limit=${limit}&level=${level}`)
    return response.data
  },

  createBackup: async () => {
    const response = await apiClient.post('/admin/system/backup')
    return response.data
  }
}
