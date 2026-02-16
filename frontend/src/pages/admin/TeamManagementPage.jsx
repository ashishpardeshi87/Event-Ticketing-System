import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Users, Filter, Trash2, Lock, UserMinus, X, Search } from 'lucide-react'
import { adminService } from '../../api/services/adminService'
import { toast } from 'react-hot-toast'

const TeamManagementPage = () => {
  const [teams, setTeams] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    eventId: '',
    status: '',
    search: ''
  })

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(true) }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [teamsRes, eventsRes] = await Promise.all([
        adminService.getAllTeams(filters),
        adminService.getAllEvents()
      ])
      
      if (teamsRes.success) setTeams(teamsRes.data)
      if (eventsRes.success) setEvents(eventsRes.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleForceLock = async (teamId) => {
    if (!confirm('Force lock this team? This will prevent further edits.')) return

    try {
      const response = await adminService.forceLockTeam(teamId)
      if (response.success) {
        toast.success('Team locked successfully')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to lock team')
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Delete this team? This action cannot be undone.')) return

    try {
      const response = await adminService.deleteTeam(teamId)
      if (response.success) {
        toast.success('Team deleted successfully')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete team')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      partial: 'bg-yellow-100 text-yellow-700',
      complete: 'bg-green-100 text-green-700',
      locked: 'bg-blue-100 text-blue-700'
    }
    return styles[status] || styles.draft
  }

  const filteredTeams = teams.filter(team => {
    if (filters.eventId && team.eventId !== filters.eventId) return false
    if (filters.status && team.status !== filters.status) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        team.name?.toLowerCase().includes(search) ||
        team.code?.toLowerCase().includes(search) ||
        team.leaderName?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Team Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">Oversee and manage all teams</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-bold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Team name, code, or leader"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sub-event</label>
              <select
                value={filters.eventId}
                onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Sub-events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="partial">Partial</option>
                <option value="complete">Complete</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teams List */}
        <div className="space-y-3">
          {filteredTeams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(team.status)}`}>
                      {team.status?.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                      {team.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Sub-event</p>
                      <p className="font-semibold text-gray-900">
                        {events.find(e => e.id === team.eventId)?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Leader</p>
                      <p className="font-semibold text-gray-900">{team.leaderName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Members</p>
                      <p className="font-semibold text-gray-900">
                        {team.members?.length || 0} / {team.maxSize || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-semibold text-gray-900">
                        {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {team.members && team.members.length > 0 && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Team Members:</p>
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((member, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {member.name || member.email}
                            {member.isLeader && ' (Leader)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {team.status !== 'locked' && (
                    <button
                      onClick={() => handleForceLock(team.id)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Force Lock"
                    >
                      <Lock className="w-5 h-5 text-blue-600" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Team"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No teams found</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Teams</p>
            <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Complete</p>
            <p className="text-2xl font-bold text-green-600">
              {teams.filter(t => t.status === 'complete').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Partial</p>
            <p className="text-2xl font-bold text-yellow-600">
              {teams.filter(t => t.status === 'partial').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Locked</p>
            <p className="text-2xl font-bold text-blue-600">
              {teams.filter(t => t.status === 'locked').length}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TeamManagementPage
