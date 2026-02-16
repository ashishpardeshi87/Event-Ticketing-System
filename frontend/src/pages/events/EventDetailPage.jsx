import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  FileText,
  ClipboardList,
} from 'lucide-react'
import { eventService } from '../../api/services/eventService'
import { registrationService } from '../../api/services/registrationService'
import { passService } from '../../api/services/passService'
import { paymentService } from '../../api/services/paymentService'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { ROUTES } from '../../config/constants'
import toast from 'react-hot-toast'

const EventDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [myPass, setMyPass] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    additionalInfo: '',
  })

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(true) }
    const handleFocus = () => fetchData(true)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [id])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.displayName || user.firstName || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [eventRes, passRes, regsRes] = await Promise.all([
        eventService.getEvent(id),
        passService.getMyPass(),
        registrationService.getMyRegistrations(),
      ])

      if (eventRes.success && eventRes.data) {
        setEvent(eventRes.data)
      }
      if (passRes.success && passRes.data) {
        setMyPass(passRes.data)
      }
      if (regsRes.success && regsRes.data) {
        setIsRegistered(regsRes.data.some((r) => r.eventId === id))
      }
    } catch (err) {
      if (!silent) { toast.error('Failed to load event'); navigate(ROUTES.EVENTS) }
      console.error('Error fetching event:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to register')
      navigate(ROUTES.LOGIN)
      return
    }

    if (!myPass) {
      toast.error('You need to purchase a pass first to register for events.')
      navigate(ROUTES.PASSES)
      return
    }

    if (isRegistered) {
      toast.error('You are already registered for this event.')
      return
    }

    try {
      setRegistering(true)

      const fee = event.registrationFee || 0

      if (fee === 0) {
        // Free event - register directly
        const response = await registrationService.registerForEvent(id, {
          eventId: id,
          formData: {
            fullName: formData.fullName || user.displayName,
            email: formData.email || user.email,
            phone: formData.phone || '',
            additionalInfo: formData.additionalInfo || '',
          },
        })

        if (response.success) {
          toast.success('Successfully registered for event!')
          setIsRegistered(true)
          setFormData({ fullName: '', email: '', phone: '', additionalInfo: '' })
          fetchData()
        } else {
          toast.error(response.message || 'Registration failed')
        }
      } else {
        // Paid event - process via Razorpay
        const orderData = {
          amount: fee,
          itemType: 'event',
          itemId: id,
          customerName: formData.fullName || user.displayName || user.email,
          customerEmail: formData.email || user.email,
          customerPhone: formData.phone || user.phoneNumber || '',
        }

        const paymentResult = await paymentService.processPayment(orderData)

        if (paymentResult.success) {
          // Backend creates registration during payment verification
          toast.success('Successfully registered for event!')
          setIsRegistered(true)
          setFormData({ fullName: '', email: '', phone: '', additionalInfo: '' })
          fetchData()
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setRegistering(false)
    }
  }

  const formatDate = (dateVal) => {
    if (!dateVal) return 'TBA'
    const d = typeof dateVal?.toDate === 'function' ? dateVal.toDate() : new Date(dateVal)
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading || !event) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  const fee = event.registrationFee || 0
  const canRegister = myPass && !isRegistered && (event.isActive !== false)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(ROUTES.EVENTS)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </button>

        {/* Banner */}
        <div className="rounded-2xl overflow-hidden bg-gray-900 shadow-xl relative">
          {event.bannerImageUrl ? (
            <img
              src={event.bannerImageUrl}
              alt={event.name}
              className="w-full h-64 md:h-80 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-80 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Calendar className="w-24 h-24 text-gray-600" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-32 pb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white mb-3">
              {event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event'}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{event.name}</h1>
            <p className="text-gray-300 mt-1">
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 inline" />
                  {event.venue}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="relative -mt-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Quick info bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-semibold text-gray-900">{event.time || 'TBA'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MapPin className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Venue</p>
                  <p className="font-semibold text-gray-900">{event.venue || 'TBA'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <DollarSign className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registration Fee</p>
                  <p className="font-semibold text-gray-900">₹{fee}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About this Event</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {event.description || 'No description available.'}
                </p>
              </div>

              {/* Team size */}
              {(event.maxTeamSize > 1 || event.maxParticipants) && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Participation</h2>
                  <div className="flex flex-wrap gap-4">
                    {event.maxTeamSize > 1 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        <span>Team size: up to {event.maxTeamSize} members</span>
                      </div>
                    )}
                    {event.maxParticipants > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        <span>Max participants: {event.maxParticipants}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Event Rules */}
              {event.rules && (Array.isArray(event.rules) ? event.rules.length > 0 : String(event.rules).trim()) && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Event Rules
                  </h2>
                  <ul className="space-y-2">
                    {Array.isArray(event.rules) ? (
                      event.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-gray-900 font-semibold mt-0.5">•</span>
                          <span>{rule}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-700 whitespace-pre-line">{event.rules}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {event.requirements && event.requirements.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Requirements
                  </h2>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {event.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prizes */}
              {event.prizes && event.prizes.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Prizes
                  </h2>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {event.prizes.map((prize, i) => (
                      <li key={i}>{prize}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Registration form */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Register for this Event</h2>

                {!myPass && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">Pass Required</p>
                        <p className="text-sm text-yellow-700">
                          You need to purchase a pass to register for events.
                        </p>
                        <button
                          onClick={() => navigate(ROUTES.PASSES)}
                          className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700"
                        >
                          Get a Pass
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isRegistered && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">You are registered!</p>
                      <p className="text-sm text-green-700">
                        You will receive event updates via email.
                      </p>
                    </div>
                  </div>
                )}

                {canRegister && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder={user?.displayName || user?.firstName || 'Your full name'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={user?.email || 'your@email.com'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Additional Information
                      </label>
                      <textarea
                        value={formData.additionalInfo}
                        onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        rows="3"
                        placeholder="Any special requirements or information..."
                      />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Registration Fee</span>
                        <span className="text-2xl font-bold text-gray-900">₹{fee}</span>
                      </div>
                      {fee > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          You will be redirected to Razorpay for secure payment
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {registering ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : fee > 0 ? (
                        'Pay & Register'
                      ) : (
                        'Register for Free'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EventDetailPage
