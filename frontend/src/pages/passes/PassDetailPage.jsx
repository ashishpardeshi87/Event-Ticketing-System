import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import {
  CreditCard,
  Check,
  Loader2,
  ArrowLeft,
  Calendar,
  Star,
  DollarSign,
} from 'lucide-react'
import { passService } from '../../api/services/passService'
import { paymentService } from '../../api/services/paymentService'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { auth } from '../../config/firebase'
import { ROUTES } from '../../config/constants'
import toast from 'react-hot-toast'

const PassDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pass, setPass] = useState(null)
  const [myPasses, setMyPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [id])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const passRes = await passService.getPass(id)
      if (passRes.success && passRes.data) setPass(passRes.data)

      // Get all user's passes to check if they own THIS specific pass
      try {
        const myPassesRes = await passService.getMyPasses()
        if (myPassesRes.success && Array.isArray(myPassesRes.data)) {
          setMyPasses(myPassesRes.data)
        } else {
          setMyPasses([])
        }
      } catch {
        setMyPasses([])
      }
    } catch (err) {
      if (!silent) { toast.error('Failed to load pass'); navigate(ROUTES.PASSES) }
      console.error('Error fetching pass:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase')
      navigate(ROUTES.LOGIN)
      return
    }

    // Check if user already owns THIS specific pass (by passType matching pass.id)
    const ownsThisPass = myPasses.some(p => p.passType === pass?.id)
    if (ownsThisPass) {
      toast.error('You already own this pass.')
      return
    }

    const price = pass?.price || 0
    if (price <= 0) {
      toast.error('Invalid pass price. Please contact support.')
      return
    }

    try {
      setPurchasing(true)
      const currentUser = auth.currentUser
      if (!currentUser) {
        toast.error('Please login again to continue')
        navigate(ROUTES.LOGIN)
        return
      }

      const orderData = {
        amount: price,
        itemType: 'pass',
        itemId: pass.id,
        customerName: user.displayName || user.email || '',
        customerEmail: user.email || '',
        customerPhone: user.phoneNumber || '',
      }

      const result = await paymentService.processPayment(orderData)

      if (result.success) {
        toast.success('Pass purchased successfully!')
        navigate('/dashboard/my-pass')
      }
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(err.response?.data?.message || err.message || 'Payment failed. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading || !pass) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  const price = pass.price || 0
  const maxEvents = pass.maxEvents || 0
  const features = Array.isArray(pass.features) ? pass.features : []
  const allowedEventIds = pass.allowedEventIds || []
  // Check if user owns THIS specific pass (by passType matching pass.id)
  const ownsThisPass = myPasses.some(p => p.passType === pass?.id)
  const canPurchase = !ownsThisPass

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate(ROUTES.PASSES)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Passes
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {pass.bannerImageUrl ? (
            <img
              src={pass.bannerImageUrl}
              alt={pass.name}
              className="w-full h-48 md:h-64 object-cover"
            />
          ) : (
            <div className="w-full h-48 md:h-64 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <CreditCard className="w-24 h-24 text-gray-600" />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{pass.name}</h1>
                <p className="text-4xl font-bold text-gray-900 mt-2 flex items-center gap-2">
                  <DollarSign className="w-8 h-8" />
                  ₹{price}
                </p>
              </div>
              {canPurchase && (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Purchase Pass'
                  )}
                </button>
              )}
            </div>

            {pass.description && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">About this Pass</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{pass.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Includes</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Up to {maxEvents} sub-event registrations</span>
                </li>
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {allowedEventIds.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Access to Sub-events</h2>
                <p className="text-gray-600">This pass includes access to {allowedEventIds.length} sub-event{allowedEventIds.length !== 1 ? 's' : ''}.</p>
              </div>
            )}

            {ownsThisPass && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="font-semibold text-green-900">You already own this pass.</p>
                <button
                  onClick={() => navigate('/dashboard/my-pass')}
                  className="mt-2 text-sm font-medium text-green-700 hover:underline"
                >
                  View My Pass
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PassDetailPage
