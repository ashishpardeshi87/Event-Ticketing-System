import apiClient from '../client'

export const authService = {
  // Verify user token with backend
  verifyToken: async () => {
    const response = await apiClient.get('/auth/verify')
    return response.data
  },

  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile')
    return response.data
  },

  // Get profile hub: profile + passes, registrations, teams, payments, attendance, qrToken
  getProfileHub: async () => {
    const response = await apiClient.get('/auth/profile/hub')
    return response.data
  },

  // Update user profile (only permitted personal fields)
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile', profileData)
    return response.data
  },

  // Delete user account
  deleteAccount: async () => {
    const response = await apiClient.delete('/auth/account')
    return response.data
  },
}