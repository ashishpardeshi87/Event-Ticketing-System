import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Download, Loader2, ArrowLeft } from 'lucide-react'
import { passService } from '../../api/services/passService'
import html2canvas from 'html2canvas'

const MyPassPage = () => {
  const navigate = useNavigate()
  const [myPass, setMyPass] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMyPass()
    const interval = setInterval(() => fetchMyPass(true), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchMyPass(true) }
    const handleFocus = () => fetchMyPass(true)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchMyPass = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      
      const response = await passService.getMyPass()
      
      if (response.success && response.data) {
        setMyPass(response.data)
      } else {
        setError('No pass found. Please purchase a pass first.')
      }
    } catch (err) {
      if (!silent) setError('No pass found. Please purchase a pass first.')
      console.error('Error fetching pass:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleDownloadTicket = async () => {
    try {
      const ticketElement = document.getElementById('ticket-card')
      if (!ticketElement) return

      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      })

      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `techfest-ticket-${myPass?.pass?.name || 'pass'}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    } catch (err) {
      console.error('Error downloading ticket:', err)
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

  if (error || !myPass) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">{error || 'No pass found'}</p>
          <button 
            onClick={() => navigate('/passes')}
            className="btn-primary"
          >
            Purchase a Pass
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const { pass, version, userStats, qrToken } = myPass

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/passes')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Passes
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-black mb-2 tracking-tight">TICKET</h1>
          <p className="text-xl font-light text-gray-700">{pass?.name || 'TechFest Pass'}</p>
        </div>

        {/* Pink neon tech ticket (live pass) */}
        <div id="ticket-card" className="relative max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-gradient-to-br from-pink-500 via-fuchsia-600 to-indigo-600 text-white">
            {/* Glow / shapes */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 -left-16 w-56 h-56 bg-pink-400 opacity-40 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 right-0 w-72 h-72 bg-indigo-400 opacity-40 rounded-full blur-3xl" />
              <svg
                className="absolute inset-0 w-full h-full opacity-25"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <path d="M0,60 Q120,20 240,60 T400,60" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" />
                <path d="M0,120 Q140,160 280,120 T400,120" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
              </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 px-8 py-8 md:px-12 md:py-10 flex flex-col md:flex-row gap-10">
              {/* Left: pass / sub-event info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] opacity-80 mb-2">
                    TechFest Pass
                  </p>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">
                    {pass?.name || 'Hackwars – Wargames'}
                  </h2>
                  {version?.version && (
                    <p className="mt-1 text-sm opacity-80">Version {version.version}</p>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm">
                  <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                    <p className="opacity-80 text-[11px]">Registered</p>
                    <p className="font-semibold">
                      {userStats?.eventsRegistered || 0}{' '}
                      <span className="opacity-80">sub-events</span>
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                    <p className="opacity-80 text-[11px]">Max sub-events</p>
                    <p className="font-semibold">
                      {userStats?.maxEvents > 0 ? userStats.maxEvents : 'No limit'}
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                    <p className="opacity-80 text-[11px]">Remaining</p>
                    <p className="font-semibold">
                      {userStats?.eventsRemaining != null ? userStats.eventsRemaining : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: QR area */}
              <div className="flex-none flex flex-col items-center justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  {qrToken ? (
                    <QRCodeSVG
                      id="qr-code"
                      value={qrToken}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-400 text-sm">
                      No QR
                    </div>
                  )}
                </div>
                <p className="mt-4 text-[11px] text-pink-100 text-center max-w-[230px]">
                  Admit one. Show this pass at sub-event entry. Valid only for your
                  registered sub-events.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button (downloads the whole ticket) */}
        <div className="text-center mt-6">
          <button
            onClick={handleDownloadTicket}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            Download Ticket
          </button>
        </div>

        {/* Allowed Sub-events */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Allowed Sub-events</h2>
          
          {(() => {
            const allowedEvents = version?.allowedEvents || []
            const allowedEventIds = version?.allowedEventIds || []
            
            if (allowedEvents.length > 0) {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allowedEvents.map((event, index) => (
                    <div key={index} className="flex items-start p-4 border border-gray-200 rounded-lg">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{event.name || event}</p>
                        {event.category && (
                          <p className="text-sm text-gray-600">{event.category}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            } else if (allowedEventIds.length > 0) {
              return (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Your pass gives access to {allowedEventIds.length} specific sub-event{allowedEventIds.length !== 1 ? 's' : ''}:</p>
                  <div className="flex flex-wrap gap-2">
                    {allowedEventIds.map((eventId, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Sub-event ID: {eventId}
                      </span>
                    ))}
                  </div>
                </div>
              )
            } else {
              return <p className="text-gray-600">No sub-events specified for this pass. Your pass does not include access to any sub-events.</p>
            }
          })()}
        </div>

        {/* Actions */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/passes')}
              className="btn-primary"
            >
              Purchase passes
            </button>
            <button
              onClick={() => navigate('/passes')}
              className="btn-secondary"
            >
              View all passes
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MyPassPage
