import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { DollarSign, Filter, Search, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import { adminService } from '../../api/services/adminService'
import { toast } from 'react-hot-toast'

const PaymentManagementPage = () => {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 5000)
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
      const [paymentsRes, statsRes] = await Promise.all([
        adminService.getAllPayments(filters),
        adminService.getPaymentStats()
      ])
      
      if (paymentsRes.success) setPayments(paymentsRes.data)
      if (statsRes.success) setStats(statsRes.data)
    } catch (error) {
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
    return `₹${formatted}`
  }

  const getStatusBadge = (status) => {
    const styles = {
      success: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700'
    }
    return styles[status] || styles.pending
  }

  const filteredPayments = payments.filter(payment => {
    if (filters.status && payment.status !== filters.status) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        payment.userName?.toLowerCase().includes(search) ||
        payment.userEmail?.toLowerCase().includes(search) ||
        payment.razorpayPaymentId?.toLowerCase().includes(search) ||
        payment.razorpayOrderId?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading payments...</p>
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
              <DollarSign className="w-6 h-6" />
              Payment Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">View payments and revenue analytics</p>
          </div>
        </div>

        {/* Revenue Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Transaction</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.avgTransaction || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue by Pass Type */}
        {stats?.revenueByPass && stats.revenueByPass.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Pass Type</h3>
            <div className="space-y-3">
              {stats.revenueByPass.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{item.passName}</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-black h-2 rounded-full"
                        style={{
                          width: `${(item.revenue / stats.totalRevenue) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-xs text-gray-600">{item.count} sales</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  placeholder="User, payment ID, or order ID"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pass</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Payment ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{payment.userName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{payment.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{payment.passName || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(payment.status)}`}>
                        {payment.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-mono text-gray-600">{payment.razorpayPaymentId || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No payments found</p>
          </div>
        )}

        {/* Daily Revenue Breakdown */}
        {stats?.dailyRevenue && stats.dailyRevenue.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Revenue (Last 7 Days)</h3>
            <div className="space-y-2">
              {stats.dailyRevenue.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{day.count} transactions</span>
                    <span className="font-bold text-gray-900">{formatCurrency(day.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default PaymentManagementPage
