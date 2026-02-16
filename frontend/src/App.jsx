import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './features/auth/hooks/useAuth'
import { useApiConnection } from './hooks/useApi'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import PassesPage from './pages/passes/PassesPage'
import PassDetailPage from './pages/passes/PassDetailPage'
import MyPassPage from './pages/passes/MyPassPage'
import TeamsPage from './pages/teams/TeamsPage'
import AdminPage from './pages/admin/AdminPage'
import PassManagementPage from './pages/admin/PassManagementPage'
import TeamManagementPage from './pages/admin/TeamManagementPage'
import RegistrationManagementPage from './pages/admin/RegistrationManagementPage'
import PaymentManagementPage from './pages/admin/PaymentManagementPage'
import SettingsPage from './pages/admin/SettingsPage'
import AttendanceManagementPage from './pages/admin/AttendanceManagementPage'
import VolunteerScannerPage from './pages/volunteer/VolunteerScannerPage'
import ProfilePage from './pages/profile/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function DashboardOrScanner() {
  const { isAdmin, isVolunteer } = useAuth()
  if (isVolunteer() && !isAdmin()) return <Navigate to="/scanner" replace />
  return <DashboardPage />
}

function App() {
  const { user, loading } = useAuth()

  // Only show loading state for auth, not API connection
  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />

      {/* Volunteer-only: QR Scanner (volunteers see only this) */}
      <Route path="/scanner" element={
        <ProtectedRoute requireVolunteer>
          <VolunteerScannerPage />
        </ProtectedRoute>
      } />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><DashboardOrScanner /></ProtectedRoute>} />
      <Route path="/dashboard" element={
        <ProtectedRoute blockVolunteer>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/passes" element={
        <ProtectedRoute blockVolunteer>
          <PassesPage />
        </ProtectedRoute>
      } />
      <Route path="/passes/:id" element={
        <ProtectedRoute blockVolunteer>
          <PassDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/passes" element={
        <ProtectedRoute blockVolunteer>
          <PassesPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/my-pass" element={
        <ProtectedRoute blockVolunteer>
          <MyPassPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/profile" element={
        <ProtectedRoute blockVolunteer>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/events" element={<Navigate to="/passes" replace />} />
      <Route path="/events/:id" element={<Navigate to="/passes" replace />} />
      <Route path="/teams" element={
        <ProtectedRoute blockVolunteer>
          <TeamsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/passes" element={
        <ProtectedRoute requireAdmin>
          <PassManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/events" element={<Navigate to="/admin/passes" replace />} />
      <Route path="/admin/teams" element={
        <ProtectedRoute requireAdmin>
          <TeamManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/registrations" element={
        <ProtectedRoute requireAdmin>
          <RegistrationManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/attendance" element={
        <ProtectedRoute requireAdmin>
          <AttendanceManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/payments" element={
        <ProtectedRoute requireAdmin>
          <PaymentManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute requireAdmin>
          <SettingsPage />
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App