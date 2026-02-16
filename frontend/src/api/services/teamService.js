import apiClient from '../client'

export const teamService = {
  // Create team for an event
  createTeam: async (eventId, teamData) => {
    const response = await apiClient.post('/teams', { eventId, ...teamData })
    return response.data
  },

  // Get user's teams
  getMyTeams: async () => {
    const response = await apiClient.get('/teams/my-teams')
    return response.data
  },

  // Get team by ID
  getTeam: async (teamId) => {
    const response = await apiClient.get(`/teams/${teamId}`)
    return response.data
  },

  // Get teams for an event
  getEventTeams: async (eventId) => {
    const response = await apiClient.get(`/teams/event/${eventId}`)
    return response.data
  },

  // Join team via code
  joinTeam: async (joinCode) => {
    const response = await apiClient.post('/teams/join', { joinCode })
    return response.data
  },

  // Leave team
  leaveTeam: async (teamId) => {
    const response = await apiClient.post(`/teams/${teamId}/leave`)
    return response.data
  },

  // Remove member (leader only)
  removeMember: async (teamId, userId) => {
    const response = await apiClient.post(`/teams/${teamId}/remove-member`, { userId })
    return response.data
  },

  // Replace member (leader only)
  replaceMember: async (teamId, oldUserId, newUserId) => {
    const response = await apiClient.post(`/teams/${teamId}/replace-member`, { oldUserId, newUserId })
    return response.data
  },

  // Lock team (leader only)
  lockTeam: async (teamId) => {
    const response = await apiClient.post(`/teams/${teamId}/lock`)
    return response.data
  },

  // Admin: Get all teams
  getAllTeams: async (filters = {}) => {
    const response = await apiClient.get('/teams/admin/all', { params: filters })
    return response.data
  },

  // Admin: Force lock team
  forceLockTeam: async (teamId) => {
    const response = await apiClient.post(`/teams/${teamId}/force-lock`)
    return response.data
  },

  // Admin: Delete team
  deleteTeam: async (teamId) => {
    const response = await apiClient.delete(`/teams/${teamId}`)
    return response.data
  },
}