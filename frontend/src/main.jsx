import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './features/auth/contexts/AuthContext.jsx'
import './index.css'

// Debug: Log when main.jsx is executed
console.log('[DEBUG] main.jsx executed at:', new Date().toISOString())

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 5000, // 5 seconds - data considered fresh for real-time feel
    },
  },
})

// Debug: Detect page reloads
let reloadCount = parseInt(sessionStorage.getItem('reloadCount') || '0')
reloadCount++
sessionStorage.setItem('reloadCount', reloadCount.toString())
console.log('[DEBUG] Page reload count:', reloadCount)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)