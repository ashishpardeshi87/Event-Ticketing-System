import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { ClipboardList, Plus, Filter, Search, X, Eye } from 'lucide-react'
import { adminService } from '../../api/services/adminService'
import { toast } from 'react-hot-toast'

const RegistrationManagementPage = () => {
  const [registrations, setRegistrations] = useState([])
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [filters, setFilters] = useState({
    eventId: '',
    search: ''
  })
  const [manualForm, setManualForm] = useState({
    userId: '',
    eventId: '',
    teamId: '',
    formData: {}
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
      const [regsRes, eventsRes, usersRes] = await Promise.all([
        adminService.getAllRegistrations(filters),
        adminService.getAllEvents(),
        adminService.getUsers({ limit: 100 })
      ])
      
      if (regsRes.success) setRegistrations(regsRes.data)
      if (eventsRes.success) setEvents(eventsRes.data)
      if (usersRes.success) setUsers(usersRes.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleManualRegister = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const response = await adminService.manualRegister(manualForm)
      if (response.success) {
        toast.success('Manual registration successful')
        setShowManualModal(false)
        setManualForm({ userId: '', eventId: '', teamId: '', formData: {} })
        fetchData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register')
    }
  }

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration)
    setShowDetailsModal(true)
  }

  const filteredRegistrations = registrations.filter(reg => {
    if (filters.eventId && reg.eventId !== filters.eventId) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        reg.userName?.toLowerCase().includes(search) ||
        reg.userEmail?.toLowerCase().includes(search) ||
        reg.eventName?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading registrations...</p>
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
              <ClipboardList className="w-6 h-6" />
              Registration Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">View and manage sub-event registrations</p>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Manual Register
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-bold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="User name, email, or sub-event"
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
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sub-event</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{reg.userName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{reg.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{reg.eventName || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{reg.teamName || 'Individual'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">
                        {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(reg)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No registrations found</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
            <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Sub-events with Registrations</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(registrations.map(r => r.eventId)).size}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Unique Participants</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(registrations.map(r => r.userId)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Manual Registration Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Manual Registration</h2>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleManualRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <select
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-event</label>
                <select
                  value={manualForm.eventId}
                  onChange={(e) => setManualForm({ ...manualForm, eventId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Sub-event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  Manual registration will bypass normal validation checks. Use with caution.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Registration Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">User</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedRegistration.userName}</p>
                  <p className="text-xs text-gray-500">{selectedRegistration.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Sub-event</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedRegistration.eventName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Team</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedRegistration.teamName || 'Individual'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Registration Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedRegistration.createdAt 
                      ? new Date(selectedRegistration.createdAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedRegistration.formData && Object.keys(selectedRegistration.formData).length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Form Data</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedRegistration.formData).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default RegistrationManagementPage
