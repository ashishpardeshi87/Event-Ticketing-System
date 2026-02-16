import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { CreditCard, Check, Star, Loader2, ChevronRight, IndianRupee } from 'lucide-react'
import { passService } from '../../api/services/passService'
import { ROUTES } from '../../config/constants'

const PassesPage = () => {
  const navigate = useNavigate()
  const [allPasses, setAllPasses] = useState([])
  const [myPasses, setMyPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData(true)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const [passesRes, myPassesRes] = await Promise.all([
        passService.getPasses(),
        passService.getMyPasses()
      ])

      if (passesRes?.success && Array.isArray(passesRes?.data)) {
        setAllPasses(passesRes.data)
      }
      if (myPassesRes?.success && Array.isArray(myPassesRes?.data)) {
        setMyPasses(myPassesRes.data)
      }
    } catch (err) {
      if (!silent) setError('Failed to load passes. Please try again.')
      console.error(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const ownedPassTypeIds = myPasses.map((p) => p.passType || p.id)
  const passesRemainingToPurchase = allPasses.filter(
    (p) => !ownedPassTypeIds.includes(p.id)
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary">
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Passes</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Purchase passes for your TechFest experience. Your passes give you access as configured.
          </p>
        </div>

        {/* Your passes (owned) */}
        {myPasses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your passes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPasses.map((pass, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200 p-6 bg-white flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">
                      {pass.passTypeDetails?.name || pass.name || 'Pass'}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {pass.passTypeDetails?.description || pass.description || '—'}
                  </p>
                  <button
                    onClick={() => navigate('/dashboard/my-pass')}
                    className="w-full py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-sm"
                  >
                    View details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchase passes – remaining to purchase */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {passesRemainingToPurchase.length > 0
              ? 'Purchase passes'
              : 'No passes left to purchase'}
          </h2>
          {passesRemainingToPurchase.length === 0 ? (
            <div className="rounded-xl border border-gray-200 p-8 text-center bg-gray-50">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">You have access to all available passes.</p>
              <button
                onClick={() => navigate('/dashboard/my-pass')}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
              >
                View my pass
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {passesRemainingToPurchase.map((pass, index) => {
                const price = pass.price ?? 0
                const maxEvents = pass.maxEvents ?? 0
                const allowedEvents = pass.allowedEventIds || pass.allowedEvents || []
                const isPopular = index === Math.min(1, passesRemainingToPurchase.length - 1)

                return (
                  <div
                    key={pass.id}
                    className={`rounded-xl border border-gray-200 overflow-hidden bg-white ${
                      isPopular ? 'ring-2 ring-gray-900' : ''
                    }`}
                  >
                    {isPopular && (
                      <div className="bg-gray-900 text-white text-center py-1 text-sm font-medium">
                        <Star className="w-4 h-4 inline mr-1" />
                        Popular
                      </div>
                    )}
                    {pass.bannerImageUrl ? (
                      <img
                        src={pass.bannerImageUrl}
                        alt={pass.name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <CreditCard className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{pass.name}</h3>
                      {pass.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pass.description}</p>
                      )}
                      <div className="flex items-center gap-1 mb-4">
                        <IndianRupee className="w-5 h-5 text-gray-700" />
                        <span className="text-2xl font-bold text-gray-900">{price}</span>
                      </div>
                      <ul className="space-y-2 mb-6 text-sm text-gray-700">
                        {maxEvents > 0 && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            Up to {maxEvents} registrations
                          </li>
                        )}
                        {allowedEvents.slice(0, 3).map((ev, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {typeof ev === 'object' ? ev?.name || ev?.id : ev}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 flex items-center justify-center gap-2"
                        onClick={() => navigate(ROUTES.PASS_DETAIL(pass.id))}
                      >
                        Purchase pass
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PassesPage
