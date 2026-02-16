import axios from 'axios'
import { auth } from '../config/firebase'
import { API_BASE_URL } from '../config/constants'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser
      console.log('[API Client] Current user:', user ? user.uid : 'No user')
      
      if (user) {
        const token = await user.getIdToken(false) // Don't force refresh - only refresh if expired
        console.log('[API Client] Token obtained:', token ? 'Yes' : 'No')
        config.headers.Authorization = `Bearer ${token}`
      } else {
        console.warn('[API Client] No authenticated user found')
      }
    } catch (error) {
      console.error('[API Client] Error getting auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Client] Response error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    })
    
    // Don't log or handle errors that might cause refresh loops
    if (error.response?.status === 401) {
      console.warn('[API Client] Unauthorized access - token may be expired')
      // Don't automatically redirect or refresh - let the component handle it
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.warn('[API Client] Request timeout')
    }
    
    if (!error.response && error.request) {
      console.warn('[API Client] Network error - backend may be unreachable')
    }
    
    return Promise.reject(error)
  }
)

// Test connection function - use API health endpoint
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/health')
    return response.data
  } catch (error) {
    throw new Error(`Backend connection failed: ${error.message}`)
  }
}

export default apiClient