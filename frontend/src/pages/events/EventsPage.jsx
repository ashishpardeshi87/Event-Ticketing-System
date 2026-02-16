import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Calendar, MapPin, Loader2, AlertCircle, IndianRupee, ArrowRight, CreditCard } from 'lucide-react'
import { eventService } from '../../api/services/eventService'
import { registrationService } from '../../api/services/registrationService'
import { passService } from '../../api/services/passService'
import { useAuth } from '../../features/auth/hooks/useAuth'

const formatDate = (dateVal) => {
  if (!dateVal) return 'TBA'
  const d = typeof dateVal?.toDate === 'function' ? dateVal.toDate() : new Date(dateVal)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
const formatTime = (t) => (t ? (typeof t === 'string' ? t : String(t)) : '')

const EventsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [allPasses, setAllPasses] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [myPasses, setMyPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const categories = ['All', 'Technical', 'Cultural', 'Workshop', 'Sports']

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
      setError(null)

      const [eventsRes, passesRes, regsRes, myPassesRes] = await Promise.all([
        eventService.getEvents(),
        passService.getPasses(),
        registrationService.getMyRegistrations().catch(() => ({ success: false, data: [] })),
        passService.getMyPasses().catch(() => ({ success: false, data: [] }))
      ])

      if (eventsRes?.success && eventsRes?.data) {
        const active = eventsRes.data.filter((e) => e.isActive !== false)
        setEvents(active)
        if (active.length > 0 && !selectedEvent) setSelectedEvent(active[0])
      }
      if (passesRes?.success && Array.isArray(passesRes?.data)) setAllPasses(passesRes.data)
      if (regsRes?.success && regsRes?.data) setMyRegistrations(regsRes.data)
      if (myPassesRes?.success && Array.isArray(myPassesRes?.data)) setMyPasses(myPassesRes.data)
    } catch (err) {
      if (!silent) setError('Failed to load events. Please try again.')
      console.error(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // When events load, auto-select first if none selected
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) setSelectedEvent(events[0])
  }, [events])

  // Passes for the selected event (fest): pass has eventId === selectedEvent.id
  const passesForSelectedEvent = selectedEvent
    ? allPasses.filter((p) => p.eventId === selectedEvent.id)
    : []

  const handleRegisterClick = (event) => {
    const hasAnyPass = myPasses.length > 0
    if (!hasAnyPass) {
      alert('You need to purchase a pass first to register for events.')
      navigate('/passes')
      return
    }
    const alreadyRegistered = myRegistrations.some((r) => r.eventId === event.id)
    if (alreadyRegistered) {
      alert('You are already registered for this event.')
      return
    }
    navigate(`/events/${event.id}`)
  }

  const filteredEvents = selectedCategory === 'All'
    ? events
    : events.filter((e) => e.category?.toLowerCase() === selectedCategory.toLowerCase())

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">
            Discover and register for exciting events and competitions
          </p>
        </div>

        {/* Pass warning */}
        {myPasses.length === 0 && (
          <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Pass required</p>
                <p className="text-sm text-amber-700">
                  You need to purchase a pass to register for events.{' '}
                  <button onClick={() => navigate('/passes')} className="underline font-medium">
                    Get a pass now
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Registrations */}
        {myRegistrations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">My Registrations</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myRegistrations.map((reg) => (
                <div key={reg.id} className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{reg.eventName || 'Event'}</h3>
                      <p className="text-sm text-gray-600">
                        Registered on {formatDate(reg.registeredAt)}
                      </p>
                    </div>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {reg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event (Fest) selector + Fest details at top + Your passes below */}
        {filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-12 text-center bg-white">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Check back later for new events</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Event selector: cards to choose which fest */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedEvent?.id === event.id
                      ? 'border-gray-900 bg-gray-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-800 mb-2">
                    {event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event'}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{event.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {event.date ? formatDate(event.date) : 'TBA'}
                    {event.venue ? ` · ${event.venue}` : ''}
                  </p>
                </button>
              ))}
            </div>

            {/* Selected fest details (from admin) – shown at top */}
            {selectedEvent && (
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                <div className="h-44 sm:h-52 bg-gray-900 relative">
                  {selectedEvent.bannerImageUrl ? (
                    <img
                      src={selectedEvent.bannerImageUrl}
                      alt={selectedEvent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <Calendar className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex px-2 py-1 rounded-lg text-xs font-bold bg-white/90 text-gray-900">
                      {selectedEvent.category ? selectedEvent.category.charAt(0).toUpperCase() + selectedEvent.category.slice(1) : 'Fest'}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.name}</h2>
                  {selectedEvent.description && (
                    <p className="text-gray-600 mb-4 whitespace-pre-line">{selectedEvent.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {selectedEvent.date && (
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedEvent.date)}
                        {selectedEvent.time ? ` · ${formatTime(selectedEvent.time)}` : ''}
                      </span>
                    )}
                    {selectedEvent.venue && (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {selectedEvent.venue}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleRegisterClick(selectedEvent)}
                      disabled={myRegistrations.some((r) => r.eventId === selectedEvent.id) || myPasses.length === 0}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                        myRegistrations.some((r) => r.eventId === selectedEvent.id) || myPasses.length === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {myRegistrations.some((r) => r.eventId === selectedEvent.id)
                        ? 'Already Registered'
                        : myPasses.length === 0
                        ? 'Pass Required'
                        : (
                          <>
                            Register for this event
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                    </button>
                    <button
                      onClick={() => navigate(`/events/${selectedEvent.id}`)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold border-2 border-gray-900 text-gray-900 hover:bg-gray-50"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Your passes – passes attached to this event (fest) */}
            {selectedEvent && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your passes</h2>
                {passesForSelectedEvent.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 p-8 text-center bg-gray-50">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No passes for this event yet.</p>
                    <p className="text-sm text-gray-500 mt-1">Passes for this fest will appear here when added by admin.</p>
                    <button
                      onClick={() => navigate('/passes')}
                      className="mt-4 px-4 py-2 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Browse all passes
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {passesForSelectedEvent.map((pass) => {
                      const owned = myPasses.some((p) => p.passType === pass.id)
                      return (
                        <div
                          key={pass.id}
                          className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow"
                        >
                          <div className="h-32 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
                            <CreditCard className="w-12 h-12 text-indigo-400" />
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900">{pass.name || 'Pass'}</h3>
                            {pass.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pass.description}</p>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="flex items-center gap-1 text-lg font-bold text-gray-900">
                                <IndianRupee className="w-5 h-5" />
                                {pass.price != null ? pass.price : 0}
                              </span>
                              <button
                                onClick={() => navigate(`/passes/${pass.id}`)}
                                disabled={owned}
                                className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm ${
                                  owned
                                    ? 'bg-gray-100 text-gray-500 cursor-default'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                              >
                                {owned ? 'Owned' : 'Get pass'}
                                {!owned && <ArrowRight className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 p-4 bg-red-50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-900 flex-1">{error}</p>
            <button onClick={() => fetchData()} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg">
              Retry
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default EventsPage
