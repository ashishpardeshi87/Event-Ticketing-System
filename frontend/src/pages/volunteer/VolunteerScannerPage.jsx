import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

// html5-qrcode v2 removed isScanSupported; patch so any stale/cached code won't throw
if (typeof Html5Qrcode !== 'undefined' && typeof Html5Qrcode.isScanSupported !== 'function') {
  Html5Qrcode.isScanSupported = () => true
}
import {
  QrCode,
  CheckCircle,
  XCircle,
  LogOut,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  CreditCard,
  Info,
  Check
} from 'lucide-react'
import { attendanceService } from '../../api/services/attendanceService'
import { adminService } from '../../api/services/adminService'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { ROUTES } from '../../config/constants'
import toast from 'react-hot-toast'

const VolunteerScannerPage = () => {
  const { user, logout, isVolunteer } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [step, setStep] = useState('scan') // 'scan' | 'review' | 'done'
  const [verifiedUser, setVerifiedUser] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [venue, setVenue] = useState('')
  const [eventId, setEventId] = useState('')
  const [events, setEvents] = useState([])
  const [manualToken, setManualToken] = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [attendance, setAttendance] = useState([])
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [marking, setMarking] = useState(false)
  const html5QrRef = useRef(null)

  const assignedEventIds = user?.assignedEventIds || []

  const fetchAttendance = async () => {
    setAttendanceLoading(true)
    try {
      const res = await attendanceService.getVolunteerAttendance({ limit: 50 })
      if (res?.success && Array.isArray(res.data)) setAttendance(res.data)
    } catch (err) {
      console.error('Failed to load attendance:', err)
    } finally {
      setAttendanceLoading(false)
    }
  }

  useEffect(() => {
    if (user && (isVolunteer() || user?.role === 'admin')) {
      adminService.getAllEvents().then((r) => {
        if (r?.success && r?.data) setEvents(r.data || [])
      })
      fetchAttendance()
    }
  }, [user?.uid])

  const handleVerify = async (qrToken) => {
    if (!qrToken?.trim()) return
    setVerifying(true)
    setVerifiedUser(null)
    setPendingToken(qrToken.trim())
    try {
      const res = await attendanceService.verify(qrToken.trim())
      if (res?.success && res?.data) {
        setVerifiedUser(res.data)
        setStep('review')
        const regs = res.data.registrations || []
        const firstReg = regs[0]
        if (firstReg?.eventId) setSelectedEventId(firstReg.eventId)
        else if (eventId) setSelectedEventId(eventId)
        else setSelectedEventId('')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid pass'
      toast.error(msg)
      setVerifiedUser(null)
      setStep('scan')
    } finally {
      setVerifying(false)
      setManualToken('')
    }
  }

  const handleMark = async (status) => {
    if (!pendingToken || !verifiedUser) return
    setMarking(true)
    try {
      const res = await attendanceService.scan({
        qrToken: pendingToken,
        venue: venue || 'General',
        eventId: selectedEventId || eventId || '',
        status
      })
      if (res?.success && res?.data) {
        toast.success(res.data.message || (status === 'present' ? 'Entry validated' : 'Marked absent'))
        setStep('done')
        setVerifiedUser((prev) => (prev ? { ...prev, marked: status, scannedAt: res.data.scannedAt } : null))
        fetchAttendance()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to mark')
    } finally {
      setMarking(false)
    }
  }

  const resetScan = () => {
    setStep('scan')
    setVerifiedUser(null)
    setPendingToken('')
  }

  const startCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera not supported in this browser')
      return
    }
    setVerifiedUser(null)
    setScanning(true)
  }

  // Start camera when scanning turns true - #qr-reader must exist (we render it when step is scan)
  useEffect(() => {
    if (!scanning || step !== 'scan') return

    const elementId = 'qr-reader'
    let scannerInstance = null

    const run = async () => {
      await new Promise((r) => setTimeout(r, 150))
      const el = document.getElementById(elementId)
      if (!el) {
        console.error('qr-reader element not found')
        setScanning(false)
        return
      }
      try {
        scannerInstance = new Html5Qrcode(elementId)
        html5QrRef.current = scannerInstance
        const config = { fps: 10, qrbox: { width: 250, height: 250 } }
        const onSuccess = (decodedText) => {
          scannerInstance.stop().then(() => {
            setScanning(false)
            html5QrRef.current = null
            handleVerify(decodedText)
          }).catch(() => {})
        }
        const onFailure = () => {}
        try {
          await scannerInstance.start({ facingMode: 'environment' }, config, onSuccess, onFailure)
        } catch (envErr) {
          await scannerInstance.start({ facingMode: 'user' }, config, onSuccess, onFailure)
        }
      } catch (err) {
        console.error('Html5Qrcode start error:', err)
        toast.error(err?.message || 'Could not start camera. Allow camera access for this site.')
        setScanning(false)
        html5QrRef.current = null
      }
    }
    run()

    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {})
        html5QrRef.current = null
      }
    }
  }, [scanning, step])

  const stopCamera = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {})
      html5QrRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (html5QrRef.current) html5QrRef.current.stop().catch(() => {})
    }
  }, [])

  const allowedEvents = assignedEventIds.length > 0
    ? events.filter((e) => assignedEventIds.includes(e.id))
    : events

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <QrCode className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Entry Scanner</h1>
              <p className="text-xs text-slate-400">Validate passes & mark attendance</p>
            </div>
          </div>
          <button
            onClick={() => logout().then(() => (window.location.href = ROUTES.LOGIN))}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Venue & Sub-event setup */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Venue / Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Main Hall, Gate A"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sub-event (for attendance)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Select sub-event (optional)</option>
              {allowedEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.name || e.title || e.id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scan section - #qr-reader always in DOM when step is scan so Html5Qrcode can attach */}
        {step === 'scan' && (
          <div className="space-y-4">
            {!scanning ? (
              <button
                onClick={startCamera}
                type="button"
                className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
              >
                <QrCode className="w-7 h-7" />
                Open Camera to Scan QR
              </button>
            ) : null}
            <div
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              style={{ display: scanning ? 'block' : 'none' }}
            >
              <div id="qr-reader" className="w-full min-h-[250px]" />
              <button
                onClick={stopCamera}
                type="button"
                className="w-full py-3 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Stop Camera
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-500">or paste token</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste QR token here"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <button
                onClick={() => handleVerify(manualToken)}
                disabled={!manualToken.trim() || verifying}
                className="w-full mt-3 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Verify & View Details
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Review: user details + mark */}
        {(step === 'review' || step === 'done') && verifiedUser && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {verifiedUser.userName?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{verifiedUser.userName}</h2>
                  <p className="text-emerald-100 text-sm">{verifiedUser.passName}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* User Contact Info */}
              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm">{verifiedUser.userEmail || '—'}</span>
                </div>
                {verifiedUser.userPhone && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm">{verifiedUser.userPhone}</span>
                  </div>
                )}
                {verifiedUser.userCollege && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm">{verifiedUser.userCollege}</span>
                  </div>
                )}
              </div>

              {/* Pass Details Section */}
              {verifiedUser.passDetails && verifiedUser.passDetails.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pass Details
                  </h3>
                  <div className="space-y-3">
                    {verifiedUser.passDetails.map((pass, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-indigo-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">{pass.passName}</p>
                            {pass.passDescription && (
                              <p className="text-xs text-slate-600 mt-1">{pass.passDescription}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            pass.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {pass.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                          {pass.purchasedAt && (
                            <div>
                              <span className="font-medium">Purchased:</span>{' '}
                              {new Date(pass.purchasedAt).toLocaleDateString()}
                            </div>
                          )}
                          {pass.maxEvents > 0 && (
                            <div>
                              <span className="font-medium">Max Sub-events:</span> {pass.maxEvents}
                            </div>
                          )}
                          {pass.eventsRegistered !== undefined && (
                            <div>
                              <span className="font-medium">Registered:</span> {pass.eventsRegistered}/{pass.maxEvents || '∞'}
                            </div>
                          )}
                          {pass.price > 0 && (
                            <div>
                              <span className="font-medium">Price:</span> ₹{pass.price}
                            </div>
                          )}
                        </div>
                        {pass.allowedEventIds && pass.allowedEventIds.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-indigo-100">
                            <p className="text-xs font-medium text-slate-700 mb-1">Allowed Sub-events:</p>
                            <p className="text-xs text-slate-600">
                              This pass includes access to {pass.allowedEventIds.length} specific event{pass.allowedEventIds.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registered Sub-events - Sub-events user can be marked for */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Registered Sub-events (Can be marked for attendance)
                </h3>
                {verifiedUser.registrations?.length > 0 ? (
                  <div className="space-y-2">
                    {verifiedUser.registrations.map((r) => (
                      <div
                        key={r.id || r.eventId}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedEventId === r.eventId
                            ? 'bg-indigo-50 border-indigo-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-900">{r.eventName || 'Sub-event'}</p>
                              {r.status && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  r.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {r.status}
                                </span>
                              )}
                            </div>
                            {r.eventDate && (
                              <p className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(r.eventDate).toLocaleDateString()}
                              </p>
                            )}
                            {r.eventVenue && (
                              <p className="text-xs text-slate-600 mb-1">📍 {r.eventVenue}</p>
                            )}
                            {r.eventCategory && (
                              <p className="text-xs text-slate-500 mb-1">Category: {r.eventCategory}</p>
                            )}
                            {r.teamName && (
                              <p className="text-xs text-indigo-600 mt-1">Team: {r.teamName}</p>
                            )}
                            {r.registeredAt && (
                              <p className="text-xs text-slate-400 mt-1">
                                Registered: {new Date(r.registeredAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {(assignedEventIds.length === 0 || assignedEventIds.includes(r.eventId)) && (
                            <button
                              onClick={() => setSelectedEventId(r.eventId)}
                              className={`ml-3 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                                selectedEventId === r.eventId
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-white border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                              }`}
                            >
                              {selectedEventId === r.eventId ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Selected
                                </span>
                              ) : (
                                'Select'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <Info className="w-3 h-3 inline mr-1" />
                        <strong>Note:</strong> User can only be marked present/absent for sub-events they are registered for.
                        Select a sub-event above to mark attendance.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ User is not registered for any sub-events. Registration is required to participate.
                    </p>
                  </div>
                )}
              </div>

              {step === 'review' && (
                <div className="space-y-3 pt-2">
                  {/* Warning if no sub-event selected or not registered */}
                  {(!selectedEventId && !eventId) && (
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Please select a sub-event from registered sub-events above to mark attendance.
                      </p>
                    </div>
                  )}
                  {selectedEventId && verifiedUser.registrations && 
                   !verifiedUser.registrations.some(r => r.eventId === selectedEventId) && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-800">
                        ⚠️ User is not registered for the selected sub-event. Cannot mark attendance.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMark('present')}
                      disabled={marking || !selectedEventId || (verifiedUser.registrations && !verifiedUser.registrations.some(r => r.eventId === selectedEventId))}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {marking ? '...' : 'Mark Present'}
                    </button>
                    <button
                      onClick={() => handleMark('absent')}
                      disabled={marking || !selectedEventId || (verifiedUser.registrations && !verifiedUser.registrations.some(r => r.eventId === selectedEventId))}
                      className="flex-1 py-4 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      {marking ? '...' : 'Mark Absent'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'done' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    {verifiedUser.marked === 'present' ? 'Entry validated' : 'Marked absent'}
                  </div>
                  {verifiedUser.scannedAt && (
                    <p className="text-sm text-emerald-700 mt-1">
                      {new Date(verifiedUser.scannedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={resetScan}
                className="w-full py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition"
              >
                Scan Next
              </button>
            </div>
          </div>
        )}

        {/* Attendance history */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={() => setAttendanceOpen(!attendanceOpen)}
            className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition"
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              Recent Attendance
            </span>
            {attendanceOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {attendanceOpen && (
            <div className="border-t border-slate-100 max-h-72 overflow-y-auto">
              {attendanceLoading ? (
                <p className="p-6 text-center text-slate-500">Loading...</p>
              ) : attendance.length === 0 ? (
                <p className="p-6 text-center text-slate-500 text-sm">No records yet</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {attendance.map((r) => (
                    <div key={r.id} className="px-5 py-4 hover:bg-slate-50/50">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{r.userName || '—'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {r.venue || 'General'} · {r.status}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {r.scannedAt ? new Date(r.scannedAt).toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default VolunteerScannerPage
