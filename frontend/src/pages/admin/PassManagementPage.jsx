import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { CreditCard, Plus, Edit2, Trash2, Eye, History, X, Check, Upload, Loader2 } from 'lucide-react'
import { adminService } from '../../api/services/adminService'
import { uploadBannerImage } from '../../utils/uploadImage'
import { toast } from 'react-hot-toast'

const PassManagementPage = () => {
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showVersionsModal, setShowVersionsModal] = useState(false)
  const [selectedPass, setSelectedPass] = useState(null)
  const [passVersions, setPassVersions] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    maxEvents: '',
    bannerImageUrl: '',
    features: [],
    maxTeamSize: '1',
    venue: '',
    date: '',
    time: '',
    category: '',
    maxParticipants: '100',
    isActive: true
  })

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
      const passesRes = await adminService.getAllPasses()
      if (passesRes.success) setPasses(passesRes.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const response = await adminService.createPass({
        ...formData,
        price: parseFloat(formData.price),
        maxEvents: parseInt(formData.maxEvents) || 1,
        maxTeamSize: parseInt(formData.maxTeamSize) || 1,
        maxParticipants: parseInt(formData.maxParticipants) || 100,
        description: formData.description || '',
        bannerImageUrl: formData.bannerImageUrl || '',
        features: formData.features || []
      })
      
      if (response.success) {
        toast.success('Pass created successfully')
        setShowCreateModal(false)
        resetForm()
        fetchData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create pass')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const response = await adminService.updatePass(selectedPass.id, {
        ...formData,
        price: parseFloat(formData.price),
        maxEvents: parseInt(formData.maxEvents) || 1,
        maxTeamSize: parseInt(formData.maxTeamSize) || 1,
        maxParticipants: parseInt(formData.maxParticipants) || 100,
        description: formData.description || '',
        bannerImageUrl: formData.bannerImageUrl || '',
        features: formData.features || []
      })
      
      if (response.success) {
        toast.success('Pass updated successfully (new version created)')
        setShowEditModal(false)
        resetForm()
        fetchData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update pass')
    }
  }

  const handleDelete = async (passId) => {
    if (!confirm('Are you sure? This will deactivate the pass.')) return
    
    try {
      const response = await adminService.deletePass(passId)
      if (response.success) {
        toast.success('Pass deactivated')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete pass')
    }
  }

  const handleViewVersions = async (pass) => {
    try {
      const response = await adminService.getPassVersions(pass.id)
      if (response.success) {
        setPassVersions(response.data)
        setSelectedPass(pass)
        setShowVersionsModal(true)
      }
    } catch (error) {
      toast.error('Failed to load versions')
    }
  }

  const openEditModal = (pass) => {
    setSelectedPass(pass)
    setFormData({
      name: pass.name || '',
      description: pass.description || '',
      price: pass.price?.toString() ?? '',
      maxEvents: pass.maxEvents?.toString() ?? '1',
      bannerImageUrl: pass.bannerImageUrl || '',
      features: pass.features || [],
      maxTeamSize: pass.maxTeamSize?.toString() ?? '1',
      venue: pass.venue || '',
      date: pass.date || '',
      time: pass.time || '',
      category: pass.category || '',
      maxParticipants: pass.maxParticipants?.toString() ?? '100',
      isActive: pass.isActive !== false
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      maxEvents: '',
      bannerImageUrl: '',
      features: [],
      maxTeamSize: '1',
      venue: '',
      date: '',
      time: '',
      category: '',
      maxParticipants: '100',
      isActive: true
    })
    setSelectedPass(null)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading passes...</p>
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
              <CreditCard className="w-6 h-6" />
              Pass Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">Create and manage passes with versioning</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Pass
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {passes.map((pass) => (
            <div key={pass.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{pass.name}</h3>
                  <p className="text-2xl font-bold text-black mt-1">₹{pass.price}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  pass.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {pass.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Sub-events</span>
                  <span className="font-semibold text-gray-900">{pass.maxEvents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allowed Sub-events</span>
                  <span className="font-semibold text-gray-900">{pass.allowedEventIds?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Version</span>
                  <span className="font-semibold text-gray-900">v{pass.currentVersion || 1}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(pass)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleViewVersions(pass)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  Versions
                </button>
                <button
                  onClick={() => handleDelete(pass.id)}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {passes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No passes created yet</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false)
              setShowEditModal(false)
              resetForm()
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {showCreateModal ? 'Create New Pass' : 'Edit Pass'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={showCreateModal ? handleCreate : handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pass Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g. Hackwars - Wargames"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  rows="3"
                  placeholder="Describe what this pass includes and its benefits..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                <div className="flex items-start gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-4 pb-5">
                      {uploadingBanner ? (
                        <Loader2 className="w-8 h-8 text-gray-500 animate-spin mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      )}
                      <p className="mb-1 text-sm text-gray-500">
                        {uploadingBanner ? 'Uploading...' : 'Click to upload banner'}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF or WebP</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={uploadingBanner}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be under 5MB')
                          return
                        }
                        try {
                          setUploadingBanner(true)
                          const url = await uploadBannerImage(file, 'passes')
                          setFormData(prev => ({ ...prev, bannerImageUrl: url }))
                          toast.success('Banner uploaded successfully')
                        } catch (err) {
                          toast.error(err.message || 'Upload failed')
                        } finally {
                          setUploadingBanner(false)
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                  {formData.bannerImageUrl && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 w-28 h-28 flex-shrink-0">
                      <img src={formData.bannerImageUrl} alt="Banner" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Upload from your PC. Image will be stored in Firebase Storage.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features / Benefits (one per line)</label>
                <textarea
                  value={Array.isArray(formData.features) ? formData.features.join('\n') : (formData.features || '')}
                  onChange={(e) => setFormData({
                    ...formData,
                    features: e.target.value.split('\n').map(f => f.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  rows="4"
                  placeholder="Up to 1 sub-event registration&#10;Access to networking sessions&#10;Digital certificate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Sub-events</label>
                  <input
                    type="number"
                    value={formData.maxEvents}
                    onChange={(e) => setFormData({ ...formData, maxEvents: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Team Size</label>
                  <input
                    type="number"
                    value={formData.maxTeamSize}
                    onChange={(e) => setFormData({ ...formData, maxTeamSize: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    min="1"
                    placeholder="1 = solo, 2+ = team"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 1 for individual, 2+ for team sub-event</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g. 10:00 AM - 5:00 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g. Sanjivani University, Hall A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="workshop">Workshop</option>
                    <option value="gaming">Gaming</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              {showEditModal && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    Editing will create a new version. Existing users will retain their current version.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  {showCreateModal ? 'Create Pass' : 'Update Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pass Versions - {selectedPass?.name}</h2>
              <button
                onClick={() => setShowVersionsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-3">
              {passVersions.map((version, index) => (
                <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">
                        v{version.version}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-semibold text-gray-900">₹{version.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Max Sub-events</p>
                      <p className="font-semibold text-gray-900">{version.maxEvents}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Allowed Sub-events</p>
                      <p className="font-semibold text-gray-900">{version.allowedEventIds?.length || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default PassManagementPage
