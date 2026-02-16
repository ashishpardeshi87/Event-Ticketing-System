import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Users, Plus, Crown, Copy, Loader2, UserMinus, Lock, LogOut, AlertCircle } from 'lucide-react'
import { teamService } from '../../api/services/teamService'
import { passService } from '../../api/services/passService'
import { useAuth } from '../../features/auth/hooks/useAuth'

const TeamsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('my-teams') // my-teams, create, join
  const [myTeams, setMyTeams] = useState([])
  const [events, setEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [myPasses, setMyPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Create team state
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [teamName, setTeamName] = useState('')
  
  // Join team state
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(true) }
    const handleFocus = () => fetchData(true)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      
      // Passes = sub-events. Load all passes as sub-events + user's passes
      const [teamsResponse, allPassesResponse, myPassesResponse] = await Promise.all([
        teamService.getMyTeams(),
        passService.getPasses(),
        passService.getMyPasses()
      ])
      
      if (teamsResponse.success) {
        setMyTeams(teamsResponse.data)
      }
      
      if (allPassesResponse?.success && Array.isArray(allPassesResponse?.data)) {
        // Filter to only passes with maxTeamSize > 1 (team sub-events)
        const teamPasses = allPassesResponse.data.filter(p => (p.maxTeamSize || 1) > 1)
        setAllEvents(teamPasses)
        setEvents(teamPasses)
      }
      
      if (myPassesResponse?.success) {
        setMyPasses(myPassesResponse.data || [])
      }
    } catch (err) {
      if (!silent) setError('Failed to load teams. Please try again.')
      console.error('Error fetching data:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Passes = sub-events. Backend validates ownership on team creation.

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    
    if (!selectedEvent || !teamName.trim()) {
      alert('Please select an event and enter a team name')
      return
    }

    try {
      setCreateLoading(true)
      
      const response = await teamService.createTeam(selectedEvent, { name: teamName })
      
      if (response.success) {
        alert(`Team created successfully! Join code: ${response.data.joinCode}`)
        setTeamName('')
        setSelectedEvent('')
        await fetchData()
        setActiveTab('my-teams')
      }
    } catch (err) {
      console.error('Error creating team:', err)
      alert(err.response?.data?.message || 'Failed to create team. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoinTeam = async (e) => {
    e.preventDefault()
    
    if (!joinCode.trim()) {
      alert('Please enter a join code')
      return
    }

    try {
      setJoinLoading(true)
      
      const response = await teamService.joinTeam(joinCode.toUpperCase())
      
      if (response.success) {
        alert('Successfully joined team!')
        setJoinCode('')
        await fetchData()
        setActiveTab('my-teams')
      }
    } catch (err) {
      console.error('Error joining team:', err)
      alert(err.response?.data?.message || 'Failed to join team. Please check the code and try again.')
    } finally {
      setJoinLoading(false)
    }
  }

  const handleLeaveTeam = async (teamId) => {
    if (!confirm('Are you sure you want to leave this team?')) return

    try {
      const response = await teamService.leaveTeam(teamId)
      
      if (response.success) {
        alert('Successfully left team')
        await fetchData()
      }
    } catch (err) {
      console.error('Error leaving team:', err)
      alert(err.response?.data?.message || 'Failed to leave team')
    }
  }

  const handleRemoveMember = async (teamId, userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await teamService.removeMember(teamId, userId)
      
      if (response.success) {
        alert('Member removed successfully')
        await fetchData()
      }
    } catch (err) {
      console.error('Error removing member:', err)
      alert(err.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleLockTeam = async (teamId) => {
    if (!confirm('Are you sure you want to lock this team? This cannot be undone.')) return

    try {
      const response = await teamService.lockTeam(teamId)
      
      if (response.success) {
        alert('Team locked successfully')
        await fetchData()
      }
    } catch (err) {
      console.error('Error locking team:', err)
      alert(err.response?.data?.message || 'Failed to lock team')
    }
  }

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code)
    alert('Join code copied to clipboard!')
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'complete': return 'bg-green-100 text-green-800'
      case 'locked': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
          <p className="text-gray-600">
            Create teams, join via code, and collaborate on events
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('my-teams')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'my-teams'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Teams ({myTeams.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'create'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Team
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'join'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join Team
          </button>
        </div>

        {/* My Teams Tab */}
        {activeTab === 'my-teams' && (
          <div className="space-y-4">
            {myTeams.length === 0 ? (
              <div className="card p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                <p className="text-gray-600 mb-4">Create a team or join one using a code</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="btn-primary"
                  >
                    Create Team
                  </button>
                  <button
                    onClick={() => setActiveTab('join')}
                    className="btn-secondary"
                  >
                    Join Team
                  </button>
                </div>
              </div>
            ) : (
              myTeams.map((team) => {
                const isLeader = team.leaderId === user?.uid
                const canLock = team.state === 'complete' && !team.locked
                
                return (
                  <div key={team.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                          <Users className="w-6 h-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                            {isLeader && <Crown className="w-4 h-4 text-yellow-500" />}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStateColor(team.state)}`}>
                              {team.state}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Sub-event: {team.eventName || 'Unknown Sub-event'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {team.members?.length || 0} / {team.maxTeamSize} members
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Join Code */}
                    {isLeader && team.state !== 'locked' && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Join Code:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono font-bold text-gray-900">
                            {team.joinCode}
                          </code>
                          <button
                            onClick={() => copyJoinCode(team.joinCode)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Members */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Members</h4>
                      <div className="space-y-2">
                        {team.members?.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900">{member.userName || member.userId}</span>
                              {member.userId === team.leaderId && (
                                <Crown className="w-3 h-3 text-yellow-500 ml-2" />
                              )}
                            </div>
                            {isLeader && member.userId !== team.leaderId && team.state !== 'locked' && (
                              <button
                                onClick={() => handleRemoveMember(team.id, member.userId)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isLeader && canLock && (
                        <button
                          onClick={() => handleLockTeam(team.id)}
                          className="btn-primary text-sm flex items-center"
                        >
                          <Lock className="w-4 h-4 mr-1" />
                          Lock Team
                        </button>
                      )}
                      {!isLeader && team.state !== 'locked' && (
                        <button
                          onClick={() => handleLeaveTeam(team.id)}
                          className="btn-secondary text-sm flex items-center"
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          Leave Team
                        </button>
                      )}
                      {team.state === 'locked' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Lock className="w-4 h-4 mr-1" />
                          Team is locked
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Create Team Tab */}
        {activeTab === 'create' && (
          <div className="card p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Select Sub-event
                </label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                >
                  <option value="">Choose a sub-event...</option>
                  {events.length === 0 ? (
                    <option value="" disabled>
                      {myPasses.length === 0 
                        ? 'Purchase a pass to create teams'
                        : 'No team sub-events available'}
                    </option>
                  ) : (
                    events.map((pass) => {
                      const owned = myPasses.some(p => p.passType === pass.id)
                      return (
                        <option key={pass.id} value={pass.id}>
                          {pass.name} (Team size: {pass.maxTeamSize || '?'})
                          {owned ? ' ✓ Owned' : ''}
                        </option>
                      )
                    })
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-gray-600 mr-2 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Team creation rules</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You need a pass that includes this sub-event to create a team (one pass + one sub-event)</li>
                      <li>You can only create one team per sub-event</li>
                      <li>Share the join code with your team members</li>
                      <li>Team must be complete before registration</li>
                      <li>Leader can remove/replace members before locking</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="btn-primary w-full"
              >
                {createLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Join Team Tab */}
        {activeTab === 'join' && (
          <div className="card p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Join Team</h2>
            <form onSubmit={handleJoinTeam} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Enter Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center text-2xl font-mono font-bold tracking-wider"
                  required
                />
                <p className="text-sm text-gray-600 mt-2">
                  Ask your team leader for the 6-character join code
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-gray-600 mr-2 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Joining rules</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You need a pass that includes the team’s sub-event to join</li>
                      <li>You can only join one team per sub-event</li>
                      <li>Team must not be full or locked</li>
                      <li>You cannot leave after team is locked</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={joinLoading}
                className="btn-primary w-full"
              >
                {joinLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Joining...
                  </span>
                ) : (
                  'Join Team'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TeamsPage