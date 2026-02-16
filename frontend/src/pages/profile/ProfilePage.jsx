import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { QRCodeSVG } from 'qrcode.react'
import {
  User,
  CreditCard,
  Calendar,
  Users,
  IndianRupee,
  ClipboardList,
  Loader2,
  Edit2,
  Check,
  X,
  Download,
  ArrowRight,
  Mail,
  Phone,
  Building2
} from 'lucide-react'
import { authService } from '../../api/services/authService'
import { ROUTES } from '../../config/constants'
import toast from 'react-hot-toast'

const formatDate = (val) => {
  if (!val) return '—'
  const d = typeof val?.toDate === 'function' ? val.toDate() : new Date(val)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatCurrency = (amount) => {
  if (amount == null) return '—'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

const ProfilePage = () => {
  const navigate = useNavigate()
  const [hub, setHub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({})

  const fetchHub = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await authService.getProfileHub()
      if (res?.success && res?.data) {
        setHub(res.data)
        setEditForm({
          firstName: res.data.profile?.firstName ?? '',
          lastName: res.data.profile?.lastName ?? '',
          displayName: res.data.profile?.displayName ?? '',
          phone: res.data.profile?.phone ?? res.data.profile?.phoneNumber ?? '',
          college: res.data.profile?.college ?? res.data.profile?.institution ?? ''
        })
      }
    } catch (err) {
      if (!silent) toast.error('Failed to load profile')
      console.error(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchHub()
    const t = setInterval(() => fetchHub(true), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchHub(true) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await authService.updateProfile(editForm)
      if (res?.success) {
        setHub((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...res.data } } : prev))
        setEditing(false)
        toast.success('Profile updated')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadQR = () => {
    if (!hub?.qrToken) return
    const svg = document.getElementById('profile-qr-code')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = 'techfest-pass-qr.png'
      link.href = pngFile
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  if (loading && !hub) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  const profile = hub?.profile || {}
  const passes = hub?.passes || []
  const registrations = hub?.registrations || []
  const teams = hub?.teams || []
  const payments = hub?.payments || []
  const attendance = hub?.attendance || []
  const qrToken = hub?.qrToken
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.displayName || profile.email || 'User'

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        {/* Personal details + QR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Personal details</h2>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                      <input
                        type="text"
                        value={editForm.firstName ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                      <input
                        type="text"
                        value={editForm.lastName ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
                    <input
                      type="text"
                      value={editForm.displayName ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">College / Institution</label>
                    <input
                      type="text"
                      value={editForm.college ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, college: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{displayName}</p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {profile.email || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-500" />
                      {profile.phone || profile.phoneNumber || '—'}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      {profile.college || profile.institution || '—'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Your QR code</h2>
              <p className="text-sm text-gray-600 mt-0.5">Single pass identity — valid at scan</p>
            </div>
            <div className="p-6 flex flex-col items-center">
              {qrToken ? (
                <>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <QRCodeSVG id="profile-qr-code" value={qrToken} size={200} level="H" includeMargin />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Purchase a pass to get your QR code.</p>
              )}
              <button
                type="button"
                onClick={() => navigate(ROUTES.PASSES)}
                className="mt-4 w-full py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                {passes.length ? 'View passes' : 'Get pass'}
              </button>
            </div>
          </div>
        </div>

        {/* Passes, Registrations, Teams */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Passes</h2>
              <button type="button" onClick={() => navigate(ROUTES.PASSES)} className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1">
                View <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {passes.length ? (
                <ul className="space-y-2">
                  {passes.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-900">{p.passTypeDetails?.name || p.passType || 'Pass'}</span>
                      <span className="text-xs text-gray-500">{p.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No passes yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Registrations</h2>
              <button type="button" onClick={() => navigate(ROUTES.PASSES)} className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1">
                View <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {registrations.length ? (
                <ul className="space-y-2">
                  {registrations.slice(0, 5).map((r) => (
                    <li key={r.id} className="py-2 border-b border-gray-50 last:border-0">
                      <p className="font-medium text-gray-900">{r.eventName || r.event?.name || 'Registration'}</p>
                      <p className="text-xs text-gray-500">{formatDate(r.eventDate || r.registeredAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No registrations yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Teams</h2>
              <button type="button" onClick={() => navigate(ROUTES.TEAMS)} className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1">
                View <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {teams.length ? (
                <ul className="space-y-2">
                  {teams.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-900">{t.name}</span>
                      <span className="text-xs text-gray-500">{t.role || 'Member'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No teams yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment & Attendance history */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Payment history</h2>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              {payments.length ? (
                <ul className="space-y-3">
                  {payments.slice(0, 10).map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.itemType === 'pass' ? 'Pass purchase' : p.itemType || 'Payment'}</p>
                        <p className="text-xs text-gray-500">{formatDate(p.paidAt)}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No payments yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Attendance history</h2>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              {attendance.length ? (
                <ul className="space-y-3">
                  {attendance.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.venue || 'Check-in'}</p>
                        <p className="text-xs text-gray-500">{formatDate(a.scannedAt)} · {a.status}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No attendance records yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ProfilePage
