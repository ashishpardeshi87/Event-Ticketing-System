import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { 
  BarChart3, 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw,
  Activity,
  DollarSign,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Database,
  Server,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { useAuthContext } from '../../features/auth/contexts/AuthContext'
import apiClient from '../../api/client'
import { adminService } from '../../api/services/adminService'
import { USER_ROLES } from '../../config/constants'
import { formatCurrency } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'

const AdminPage = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [systemHealth, setSystemHealth] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [volunteerLoading, setVolunteerLoading] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [allEvents, setAllEvents] = useState([])
  const [assignEventIds, setAssignEventIds] = useState([])
  const [assignSaving, setAssignSaving] = useState(false)

  const fetchDashboardData = async (options = {}) => {
    const { isRefresh = false, silent = false } = typeof options === 'boolean' ? { isRefresh: options } : options
    try {
      if (!silent) {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
      }
      setError(null)

      const [statsResponse, healthResponse, usersResponse] = await Promise.allSettled([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/system/health'),
        apiClient.get('/admin/users?limit=10')
      ])

      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data?.success) {
        setStats(statsResponse.value.data.data)
      }

      if (healthResponse.status === 'fulfilled' && healthResponse.value?.data?.success) {
        setSystemHealth(healthResponse.value.data.data)
      }

      if (usersResponse.status === 'fulfilled' && usersResponse.value?.data?.success) {
        setUsers(usersResponse.value.data.data)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (!isRefresh) {
        setError('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Silent background refresh every 30s - data only, no loading/blink
  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(() => fetchDashboardData({ isRefresh: true, silent: true }), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchDashboardData({ isRefresh: true, silent: true }) }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  const handleSetVolunteer = async (userId) => {
    setVolunteerLoading(userId)
    try {
      const res = await adminService.setVolunteerRole(userId)
      if (res?.success) fetchDashboardData({ isRefresh: true, silent: true })
    } catch (err) {
      console.error('Failed to set volunteer:', err)
    } finally {
      setVolunteerLoading(null)
    }
  }

  const handleRemoveVolunteer = async (userId) => {
    setVolunteerLoading(userId)
    try {
      const res = await adminService.removeVolunteerRole(userId)
      if (res?.success) fetchDashboardData({ isRefresh: true, silent: true })
    } catch (err) {
      console.error('Failed to remove volunteer:', err)
    } finally {
      setVolunteerLoading(null)
    }
  }

  const isVolunteer = (u) => u?.role === USER_ROLES.VOLUNTEER || u?.role === USER_ROLES.ADMIN || u?.role === USER_ROLES.SUPER_ADMIN
  const isAdminUser = (u) => u?.role === USER_ROLES.ADMIN || u?.role === USER_ROLES.SUPER_ADMIN

  const openAssignModal = (u) => {
    setAssignModal(u)
    setAssignEventIds(u?.assignedEventIds || [])
    adminService.getAllEvents().then((r) => {
      if (r?.success && r?.data) setAllEvents(r.data)
    })
  }

  const handleAssignSave = async () => {
    if (!assignModal?.id) return
    setAssignSaving(true)
    try {
      const res = await adminService.assignVolunteerToEvents(assignModal.id, assignEventIds)
      if (res?.success) {
        toast.success('Volunteer assigned to events')
        setAssignModal(null)
        fetchDashboardData({ isRefresh: true, silent: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign')
    } finally {
      setAssignSaving(false)
    }
  }

  const toggleAssignEvent = (eid) => {
    setAssignEventIds((prev) =>
      prev.includes(eid) ? prev.filter((id) => id !== eid) : [...prev, eid]
    )
  }

  const getStatCards = () => {
    if (!stats) return []

    const newUsersGrowth = stats.users?.new || 0
    const revenueGrowth = ((stats.revenue?.total || 0) / 100000 * 100).toFixed(1)

    return [
      {
        name: 'Total Users',
        value: formatNumber(stats.users?.total || 0),
        change: `+${newUsersGrowth} this week`,
        changeType: 'positive',
        icon: Users,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        trend: '+12.5%'
      },
      {
        name: 'Passes',
        value: stats.passes?.total?.toString() || stats.passes?.active?.toString() || '0',
        change: `${stats.passes?.total || 0} total passes`,
        changeType: 'neutral',
        icon: Calendar,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        trend: '+8.2%'
      },
      {
        name: 'Total Revenue',
        value: formatCurrency(stats.revenue?.total || 0),
        change: `${stats.revenue?.transactions || 0} transactions`,
        changeType: 'positive',
        icon: DollarSign,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        trend: `+${revenueGrowth}%`
      },
      {
        name: 'Registrations',
        value: formatNumber(stats.registrations?.total || 0),
        change: `${stats.teams?.total || 0} teams formed`,
        changeType: 'positive',
        icon: TrendingUp,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        trend: '+15.3%'
      },
    ]
  }

  const managementCards = [
    {
      title: 'Pass Management',
      description: 'Create and manage festival passes',
      icon: CreditCard,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/admin/passes'),
      stats: { label: 'Passes', value: stats?.passes?.total ?? '-' }
    },
    {
      title: 'Pass Management',
      description: 'Create, edit, and manage passes',
      icon: Calendar,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => navigate('/admin/passes'),
      stats: { label: 'Passes', value: stats?.passes?.total ?? '-' }
    },
    {
      title: 'Registrations',
      description: 'View and manage sub-event registrations',
      icon: BarChart3,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => navigate('/admin/registrations'),
      stats: { label: 'Total', value: stats?.registrations?.total || 0 }
    },
    {
      title: 'Attendance',
      description: 'View QR scan attendance and venue records',
      icon: UserCheck,
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      action: () => navigate('/admin/attendance'),
      stats: { label: 'Records', value: '-' }
    },
    {
      title: 'Team Management',
      description: 'Oversee teams and registrations',
      icon: Shield,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => navigate('/admin/teams'),
      stats: { label: 'Teams', value: stats?.teams?.total || 0 }
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Loading admin dashboard...</p>
            <p className="text-sm text-gray-600 mt-2">Fetching latest data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
          <button 
            onClick={() => fetchDashboardData({ isRefresh: true })}
            className="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-black rounded-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back, <span className="font-semibold">{user?.displayName || user?.email}</span>
            </p>
          </div>
          <button 
            onClick={() => fetchDashboardData({ isRefresh: true })}
            disabled={refreshing}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStatCards().map((stat) => {
            const Icon = stat.icon
            const isPositive = stat.changeType === 'positive'
            const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
            
            return (
              <div 
                key={stat.name} 
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-600' : 'text-gray-600'}`}>
                    <TrendIcon className="w-4 h-4" />
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    {stat.change}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* System Health & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Status
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {systemHealth ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Overall Status
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      systemHealth.status === 'healthy' 
                        ? 'bg-green-100 text-green-700'
                        : systemHealth.status === 'degraded'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {systemHealth.status === 'healthy' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {systemHealth.status === 'degraded' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {systemHealth.status === 'unhealthy' && <XCircle className="w-3 h-3 mr-1" />}
                      {systemHealth.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  {Object.entries(systemHealth.services || {}).map(([service, status]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'operational' ? 'bg-green-500' : status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        {service}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        status === 'operational' 
                          ? 'bg-green-50 text-green-700'
                          : status === 'degraded'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {status}
                      </span>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Uptime
                      </span>
                      <span className="font-semibold">
                        {Math.floor((systemHealth.metrics?.uptime || 0) / 3600)}h {Math.floor(((systemHealth.metrics?.uptime || 0) % 3600) / 60)}m
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Loading system status...</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg overflow-hidden text-white">
            <div className="px-6 py-5 border-b border-gray-700">
              <h2 className="text-lg font-bold">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/admin/passes')}
                  className="p-4 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-xl transition-all text-left group"
                >
                  <Calendar className="w-6 h-6 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-1">Manage Passes</h3>
                  <p className="text-xs text-gray-300">Create and edit passes</p>
                </button>
                <button
                  onClick={() => navigate('/admin/registrations')}
                  className="p-4 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-xl transition-all text-left group"
                >
                  <Users className="w-6 h-6 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-1">Registrations</h3>
                  <p className="text-xs text-gray-300">View all registrations</p>
                </button>
                <button
                  onClick={() => navigate('/admin/payments')}
                  className="p-4 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-xl transition-all text-left group"
                >
                  <BarChart3 className="w-6 h-6 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-1">Payments</h3>
                  <p className="text-xs text-gray-300">Revenue and transactions</p>
                </button>
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="p-4 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-xl transition-all text-left group"
                >
                  <Shield className="w-6 h-6 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-1">Settings</h3>
                  <p className="text-xs text-gray-300">System config</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Recent Users
              </h2>
              <button
                onClick={() => navigate('/admin/registrations')}
                className="text-sm font-medium text-black hover:underline"
              >
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {user.displayName || 'No name'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === USER_ROLES.VOLUNTEER
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {(user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN) && <Shield className="w-3 h-3 mr-1" />}
                          {user.role?.toUpperCase() || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {!isAdminUser(user) && (
                            isVolunteer(user) ? (
                              <>
                                <button
                                  onClick={() => openAssignModal(user)}
                                  className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                                  title="Assign to events"
                                >
                                  Assign events
                                </button>
                                <button
                                  onClick={() => handleRemoveVolunteer(user.id)}
                                  disabled={volunteerLoading === user.id}
                                  className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                                  title="Remove volunteer access"
                                >
                                  {volunteerLoading === user.id ? '...' : 'Remove Volunteer'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleSetVolunteer(user.id)}
                                disabled={volunteerLoading === user.id}
                                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Make volunteer (QR scanner access)"
                              >
                                {volunteerLoading === user.id ? '...' : 'Make Volunteer'}
                              </button>
                            )
                          )}
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View user"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button 
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {managementCards.map((card) => {
            const Icon = card.icon
            return (
              <div 
                key={card.title} 
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                onClick={card.action}
              >
                <div className={`${card.bgColor} p-3 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">{card.stats.label}</p>
                    <p className="text-xl font-bold text-gray-900">{card.stats.value}</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">{error}</p>
            </div>
            <button 
              onClick={() => fetchDashboardData({ isRefresh: true })}
              className="px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Assign volunteer to events</h3>
              <p className="text-sm text-gray-600 mb-4">{assignModal.displayName || assignModal.email}</p>
              <p className="text-xs text-gray-500 mb-3">Volunteer can only mark attendance for selected events. Leave empty = all events.</p>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {allEvents.map((e) => (
                  <label key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignEventIds.includes(e.id)}
                      onChange={() => toggleAssignEvent(e.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-900">{e.name || e.title || e.id}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setAssignModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSave}
                  disabled={assignSaving}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {assignSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminPage
