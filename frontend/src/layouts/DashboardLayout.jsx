import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  IndianRupee,
  ClipboardList,
  UserCheck,
  User,
  Ticket
} from 'lucide-react'
import { ROUTES } from '../config/constants'

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = useMemo(() => [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Profile', href: ROUTES.PROFILE, icon: User },
    { name: 'My Passes', href: ROUTES.MY_PASSES, icon: CreditCard },
    { name: 'Purchase Passes', href: ROUTES.PURCHASE_PASSES, icon: Ticket },
    { name: 'Teams', href: ROUTES.TEAMS, icon: Users },
  ], [])

  const adminNavigation = useMemo(() => [
    { name: 'Admin Dashboard', href: ROUTES.ADMIN, icon: Shield },
    { name: 'Pass Management', href: '/admin/passes', icon: CreditCard },
    { name: 'Team Management', href: '/admin/teams', icon: Users },
    { name: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
    { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
    { name: 'Payments', href: '/admin/payments', icon: IndianRupee },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ], [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.LOGIN)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 shadow-sm transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 h-full max-h-screen`}>
        
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className={`text-xl font-bold text-black transition-opacity duration-300 ${sidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
            TechFest
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - scrollable when content overflows */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${sidebarCollapsed ? 'lg:justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                <span className={`transition-opacity duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                  {item.name}
                </span>
              </button>
            )
          })}

          {/* Admin Section */}
          {isAdmin() && (
            <>
              <div className={`pt-4 pb-2 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </div>
              </div>
              {adminNavigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                      isActive 
                        ? 'bg-black text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${sidebarCollapsed ? 'lg:justify-center' : ''}`}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                    <span className={`transition-opacity duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <div className={`px-3 py-4 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
            <div className={`flex items-center mb-3 ${sidebarCollapsed ? 'lg:justify-center' : 'px-3'}`}>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-700 font-semibold text-sm">
                    {user?.firstName?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </span>
                )}
              </div>
              <div className={`ml-3 flex-1 min-w-0 transition-opacity duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName || user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all ${
                sidebarCollapsed ? 'lg:justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Sign Out' : ''}
            >
              <LogOut className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
              <span className={`transition-opacity duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                Sign Out
              </span>
            </button>
          </div>
        </div>

        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 shadow-sm"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top bar - Mobile Only */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-black">TechFest</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout