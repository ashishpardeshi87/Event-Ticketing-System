import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ children, requireAdmin = false, requireVolunteer = false, blockVolunteer = false }) => {
  const { user, loading, isAdmin, isVolunteer } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin()) return <Navigate to="/dashboard" replace />
  if (requireVolunteer && !isVolunteer()) return <Navigate to="/dashboard" replace />
  if (blockVolunteer && isVolunteer() && !isAdmin()) return <Navigate to="/scanner" replace />

  return children
}

export default ProtectedRoute