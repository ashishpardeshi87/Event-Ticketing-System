import apiClient from '../client'

export const passService = {
  // Get all available passes. Optional: getPasses({ eventId }) for passes attached to that event (fest)
  getPasses: async (params = {}) => {
    const response = await apiClient.get('/passes', { params })
    return response.data
  },

  // Get single pass by ID
  getPass: async (passId) => {
    const response = await apiClient.get(`/passes/${passId}`)
    return response.data
  },

  // Get user's pass with their specific version
  getMyPass: async () => {
    const response = await apiClient.get('/passes/my-pass')
    return response.data
  },

  // Get user's passes as array (multi-pass support)
  getMyPasses: async () => {
    try {
      const response = await apiClient.get('/passes/my-passes')
      return {
        success: response.data?.success ?? true,
        data: Array.isArray(response.data?.data) ? response.data.data : []
      }
    } catch (err) {
      return { success: false, data: [] }
    }
  },

  // Validate pass for event registration
  validatePassForEvent: async (eventId) => {
    const response = await apiClient.post('/passes/validate-event', { eventId })
    return response.data
  },

  // Verify QR token
  verifyQRToken: async (qrToken) => {
    const response = await apiClient.post('/passes/verify-qr', { qrToken })
    return response.data
  },

  // Admin: Create new pass
  createPass: async (passData) => {
    const response = await apiClient.post('/passes', passData)
    return response.data
  },

  // Admin: Update pass (creates new version)
  updatePass: async (passId, passData) => {
    const response = await apiClient.put(`/passes/${passId}`, passData)
    return response.data
  },

  // Admin: Get pass versions
  getPassVersions: async (passId) => {
    const response = await apiClient.get(`/passes/${passId}/versions`)
    return response.data
  },

  // Admin: Delete pass
  deletePass: async (passId) => {
    const response = await apiClient.delete(`/passes/${passId}`)
    return response.data
  },
}