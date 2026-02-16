import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { UserCheck, RefreshCw, Filter, CheckCircle2, XCircle, Calendar, MapPin } from 'lucide-react'
import { attendanceService } from '../../api/services/attendanceService'
import { adminService } from '../../api/services/adminService'

const AttendanceManagementPage = () => {
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ eventId: '', venue: '', status: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [allRes, statsRes, eventsRes] = await Promise.all([
        attendanceService.getAll(filters),
        attendanceService.getStats(),
        adminService.getAllEvents()
      ])
      if (allRes?.success) setAttendance(allRes.data || [])
      if (statsRes?.success) setStats(statsRes.data)
      if (eventsRes?.success) setEvents(eventsRes.data || [])
    } catch (err) {
      console.error('Failed to load attendance:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const formatDate = (d) => {
    if (!d) return '-'
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleString()
  }

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value || '' }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-8 h-8" />
            Attendance
          </h1>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> Present
              </p>
              <p className="text-2xl font-bold text-green-600">{stats.present || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-600" /> Absent
              </p>
              <p className="text-2xl font-bold text-red-600">{stats.absent || 0}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filters.eventId}
              onChange={(e) => handleFilter('eventId', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All sub-events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name || e.title || e.id}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Venue"
              value={filters.venue}
              onChange={(e) => handleFilter('venue', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-40"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilter('status', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="w-10 h-10 animate-spin text-gray-400" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pass</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sub-event</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Scanned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.length > 0 ? (
                    attendance.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                              {r.userName?.charAt(0) || r.userEmail?.charAt(0) || '?'}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 block">{r.userName || '-'}</span>
                              {r.userCollege && (
                                <span className="text-xs text-gray-500">{r.userCollege}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>
                            <div>{r.userEmail || '-'}</div>
                            {r.userPhone && (
                              <div className="text-xs text-gray-500 mt-1">{r.userPhone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{r.passName || r.passType || '-'}</div>
                            {r.passDetails && r.passDetails.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {r.passDetails.length} pass{r.passDetails.length !== 1 ? 'es' : ''}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {r.venue || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>
                            {r.eventName || (r.eventId ? (
                              events.find(e => e.id === r.eventId)?.name || events.find(e => e.id === r.eventId)?.title || r.eventId
                            ) : '-')}
                            {r.eventId && !r.eventName && (
                              <span className="text-xs text-gray-400 block mt-1">ID: {r.eventId}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            r.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {r.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {r.status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.scannedAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No attendance records yet</p>
                        <p className="text-sm text-gray-500 mt-1">Volunteers scan QR tickets to record attendance</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AttendanceManagementPage
