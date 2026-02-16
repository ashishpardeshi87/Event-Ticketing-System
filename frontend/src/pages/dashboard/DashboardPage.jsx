import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  CreditCard,
  Users,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  IndianRupee
} from 'lucide-react'
import { passService } from '../../api/services/passService'
import { teamService } from '../../api/services/teamService'
import { ROUTES } from '../../config/constants'

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [myPasses, setMyPasses] = useState([])
  const [availablePasses, setAvailablePasses] = useState([])
  const [myTeams, setMyTeams] = useState([])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(() => fetchDashboardData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchDashboardData(true)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const [passesRes, myPassesRes, teamsRes] = await Promise.allSettled([
        passService.getPasses(),
        passService.getMyPasses(),
        teamService.getMyTeams()
      ])

      if (passesRes.status === 'fulfilled' && passesRes.value?.success) {
        setAvailablePasses(passesRes.value.data || [])
      }
      if (myPassesRes.status === 'fulfilled' && myPassesRes.value?.success) {
        setMyPasses(myPassesRes.value.data || [])
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.success) {
        setMyTeams(teamsRes.value.data || [])
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      if (!silent) setError('Failed to load dashboard data')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const ownedPassIds = myPasses.map((p) => p.passType || p.id)
  const passesRemainingToPurchase = availablePasses.filter(
    (p) => !ownedPassIds.includes(p.id)
  )

  const stats = [
    {
      name: 'My Passes',
      value: myPasses.length,
      subtitle: myPasses.length === 0 ? 'No passes yet' : 'Active passes',
      icon: CreditCard,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      name: 'Passes to purchase',
      value: passesRemainingToPurchase.length,
      subtitle: passesRemainingToPurchase.length === 0 ? 'You have all' : 'Available',
      icon: CreditCard,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      name: 'My Teams',
      value: myTeams.length,
      subtitle: myTeams.length === 0 ? 'Join or create a team' : 'Active teams',
      icon: Users,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-2xl shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-48 h-48 bg-white opacity-5 rounded-full" />
          <div className="relative px-8 py-10">
            <div className="flex items-center mb-3">
              <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {user?.firstName || user?.displayName || 'User'}!
              </h1>
            </div>
            <p className="text-gray-300 text-lg mb-6">
              {myPasses.length > 0
                ? `You have ${myPasses.length} pass${myPasses.length > 1 ? 'es' : ''}`
                : 'Get your pass to access TechFest.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(ROUTES.PASSES)}
                className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                {passesRemainingToPurchase.length > 0 ? 'Purchase passes' : 'View passes'}
                <ArrowRight className="w-4 h-4" />
              </button>
              {myPasses.length > 0 && (
                <button
                  onClick={() => navigate('/dashboard/my-pass')}
                  className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-black transition-all"
                >
                  My pass
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className={`${stat.bgColor} p-3 rounded-lg w-fit mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.subtitle}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Passes remaining to purchase */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Purchase passes</h2>
                <button
                  onClick={() => navigate(ROUTES.PASSES)}
                  className="text-sm font-medium text-gray-600 hover:underline flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {passesRemainingToPurchase.length > 0 ? (
                  passesRemainingToPurchase.slice(0, 5).map((pass) => (
                    <div
                      key={pass.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{pass.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                          <IndianRupee className="w-4 h-4" />
                          {pass.price != null ? pass.price : 0}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(ROUTES.PASS_DETAIL(pass.id))}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                      >
                        Purchase
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No passes left to purchase</h3>
                    <p className="text-gray-600 mb-4">You have access to all available passes.</p>
                    <button
                      onClick={() => navigate(ROUTES.PASSES)}
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800"
                    >
                      View my passes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: My Passes + Teams + Quick actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <h3 className="text-lg font-bold text-gray-900">My passes</h3>
              </div>
              <div className="p-6">
                {myPasses.length > 0 ? (
                  <div className="space-y-3">
                    {myPasses.slice(0, 3).map((pass, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900">
                            {pass.passTypeDetails?.name || pass.name || 'Pass'}
                          </h4>
                          <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
                            Active
                          </span>
                        </div>
                        <button
                          onClick={() => navigate('/dashboard/my-pass')}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          View details
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate(ROUTES.PASSES)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-sm"
                    >
                      View all passes
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-4">No passes yet</p>
                    <button
                      onClick={() => navigate(ROUTES.PASSES)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700"
                    >
                      Purchase pass
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
                <h3 className="text-lg font-bold text-gray-900">My teams</h3>
              </div>
              <div className="p-6">
                {myTeams.length > 0 ? (
                  <div className="space-y-3">
                    {myTeams.slice(0, 3).map((team, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                      >
                        <h4 className="font-bold text-gray-900">{team.name}</h4>
                        <p className="text-sm text-gray-600">{team.members?.length || 0} members</p>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate(ROUTES.TEAMS)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-sm"
                    >
                      View all teams
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-4">No teams yet</p>
                    <button
                      onClick={() => navigate(ROUTES.TEAMS)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
                    >
                      Create or join team
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg text-white p-6">
              <h3 className="text-lg font-bold mb-4">Quick actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(ROUTES.PASSES)}
                  className="w-full px-4 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-medium text-left"
                >
                  Purchase passes
                </button>
                <button
                  onClick={() => navigate(ROUTES.TEAMS)}
                  className="w-full px-4 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-medium text-left"
                >
                  Manage teams
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-900 flex-1">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
