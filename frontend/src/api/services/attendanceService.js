import apiClient from '../client'

export const attendanceService = {
  verify: async (qrToken) => {
    const response = await apiClient.post('/attendance/verify', { qrToken })
    return response.data
  },
  scan: async (data) => {
    const response = await apiClient.post('/attendance/scan', data)
    return response.data
  },
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await apiClient.get(`/attendance${params ? `?${params}` : ''}`)
    return response.data
  },
  getByEvent: async (eventId) => {
    const response = await apiClient.get(`/attendance/event/${eventId}`)
    return response.data
  },
  getStats: async () => {
    const response = await apiClient.get('/attendance/stats')
    return response.data
  },
  getVolunteerAttendance: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await apiClient.get(`/attendance/volunteer${params ? `?${params}` : ''}`)
    return response.data
  }
}
