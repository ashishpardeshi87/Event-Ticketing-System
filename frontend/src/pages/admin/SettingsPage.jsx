import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle2, Database, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '../../config/constants'

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    registrationOpen: true,
    teamDeadline: '',
    maintenanceMode: false,
    maxPassPurchasePerUser: 1,
    allowPassUpgrade: false,
    platformName: 'TechFest',
    supportEmail: '',
    razorpayEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // Try to fetch settings from backend
      // For now, load from localStorage as fallback
      const savedSettings = localStorage.getItem('platformSettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleInitializeData = async () => {
    if (!confirm('Initialize sample passes and events? This will add data if none exists.')) return
    try {
      setInitializing(true)
      const baseUrl = API_BASE_URL.replace('/api', '')
      const response = await fetch(`${baseUrl}/initialize-data`, { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        toast.success('Sample data initialized successfully!')
      } else {
        toast.error(data.message || 'Failed to initialize data')
      }
    } catch (error) {
      toast.error('Failed to initialize data. Ensure backend is running.')
    } finally {
      setInitializing(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Save to localStorage (in production, this would call an API)
      localStorage.setItem('platformSettings', JSON.stringify(settings))
      
      // In production, uncomment this:
      // await adminService.updateSettings(settings)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success('Settings saved successfully')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6" />
              Platform Settings
            </h1>
            <p className="text-sm text-gray-600 mt-1">Configure global platform settings</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <>
                <button
                  onClick={fetchSettings}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
            {!hasChanges && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                All changes saved
              </div>
            )}
          </div>
        </div>

        {/* Registration Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Registration Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Registration Open</label>
                <p className="text-xs text-gray-600 mt-1">Allow users to register for events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.registrationOpen}
                  onChange={(e) => handleChange('registrationOpen', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Team Edit Deadline</label>
              <input
                type="datetime-local"
                value={settings.teamDeadline}
                onChange={(e) => handleChange('teamDeadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Teams cannot be edited after this date</p>
            </div>
          </div>
        </div>

        {/* Pass Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pass Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Max Pass Purchase Per User</label>
              <input
                type="number"
                value={settings.maxPassPurchasePerUser}
                onChange={(e) => handleChange('maxPassPurchasePerUser', parseInt(e.target.value))}
                min="1"
                max="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Currently locked to 1 per requirement</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Allow Pass Upgrades</label>
                <p className="text-xs text-gray-600 mt-1">Let users upgrade their pass (Not recommended)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowPassUpgrade}
                  onChange={(e) => handleChange('allowPassUpgrade', e.target.checked)}
                  className="sr-only peer"
                  disabled
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black opacity-50 cursor-not-allowed"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                placeholder="support@techfest.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
                <p className="text-xs text-gray-600 mt-1">Disable platform for maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Razorpay Enabled</label>
                <p className="text-xs text-gray-600 mt-1">Enable Razorpay payment gateway</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.razorpayEnabled}
                  onChange={(e) => handleChange('razorpayEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Payment Configuration</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Razorpay keys are configured via environment variables. Update .env file to change payment credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Initialize Data (Development) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Sample Data
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Initialize sample passes and events. Use this when starting fresh. Skips if data already exists.
          </p>
          <button
            onClick={handleInitializeData}
            disabled={initializing}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {initializing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Initialize Sample Data
              </>
            )}
          </button>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Version</span>
              <span className="font-semibold text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Database</span>
              <span className="font-semibold text-gray-900">Firestore</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Authentication</span>
              <span className="font-semibold text-gray-900">Firebase Auth</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Gateway</span>
              <span className="font-semibold text-gray-900">Razorpay</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Important Note</p>
              <p className="text-xs text-yellow-700 mt-1">
                Settings changes take effect immediately. Some settings may require users to refresh their browser.
                Always test changes in a staging environment first.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
