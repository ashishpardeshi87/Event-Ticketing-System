import { useState, useEffect } from 'react'
import { testConnection } from '../api/client'

export const useApiConnection = () => {
  const [isConnected, setIsConnected] = useState(true) // Assume connected initially
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setError(null)
        await testConnection()
        if (!isConnected) {
          setIsConnected(true)
        }
      } catch (err) {
        setIsConnected(false)
        setError(err.message)
        console.error('API connection failed:', err)
      }
    }

    // Only check once on mount
    checkConnection()

    // Check connection every 60 seconds (reduced from 30)
    // Only if there was an error before
    const interval = setInterval(() => {
      if (!isConnected) {
        checkConnection()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [isConnected])

  return { isConnected, isLoading, error }
}