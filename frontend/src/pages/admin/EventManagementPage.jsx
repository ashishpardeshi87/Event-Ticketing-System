import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Calendar, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Save, Upload, Loader2 } from 'lucide-react'
import { adminService } from '../../api/services/adminService'
import { uploadBannerImage } from '../../utils/uploadImage'
import { toast } from 'react-hot-toast'

const EVENT_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'workshop', label: 'Workshop' }
]

const EventManagementPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    date: '',
    time: '',
    venue: '',
    registrationFee: '',
    maxParticipants: '',
    maxTeamSize: '',
    maxTeams: '',
    bannerImageUrl: '',
    requirements: [],
    prizes: [],
    rules: [],
    isActive: true
  })

  const fetchEvents = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const response = await adminService.getAllEvents()
      if (response.success) {
        setEvents(response.data)
      }
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load events')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(() => fetchEvents(true), 30000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchEvents(true) }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchEvents])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        maxParticipants: parseInt(formData.maxParticipants) || 100,
        maxTeamSize: parseInt(formData.maxTeamSize) || 1,
        maxTeams: parseInt(formData.maxTeams) || 0,
        bannerImageUrl: formData.bannerImageUrl || '',
        requirements: formData.requirements || [],
        prizes: formData.prizes || [],
        rules: formData.rules || [],
        isActive: formData.isActive
      }

      const response = editMode
        ? await adminService.updateEvent(selectedEvent.id, payload)
        : await adminService.createEvent(payload)

      if (response.success) {
        toast.success(editMode ? 'Event updated successfully' : 'Event created successfully')
        setShowModal(false)
        resetForm()
        fetchEvents()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save event')
    }
  }, [formData, editMode, selectedEvent, fetchEvents])

  const handleToggleStatus = useCallback(async (eventId) => {
    try {
      const response = await adminService.toggleEventStatus(eventId)
      if (response.success) {
        toast.success('Event status updated')
        fetchEvents()
      }
    } catch (error) {
      toast.error('Failed to toggle status')
    }
  }, [fetchEvents])

  const handleDelete = useCallback(async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await adminService.deleteEvent(eventId)
      if (response.success) {
        toast.success('Event deleted successfully')
        fetchEvents()
      }
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }, [fetchEvents])

  const openEditModal = useCallback((event) => {
    setSelectedEvent(event)
    setEditMode(true)
    const dateVal = event.date
    const dateStr = dateVal
      ? (typeof dateVal?.toDate === 'function'
          ? dateVal.toDate()
          : new Date(dateVal)
        ).toISOString().split('T')[0]
      : ''
    setFormData({
      name: event.name || '',
      description: event.description || '',
      category: event.category || '',
      date: dateStr,
      time: event.time || '',
      venue: event.venue || '',
      registrationFee: event.registrationFee?.toString() ?? '0',
      maxParticipants: event.maxParticipants?.toString() ?? '100',
      maxTeamSize: event.maxTeamSize?.toString() ?? '1',
      maxTeams: event.maxTeams?.toString() ?? '0',
      bannerImageUrl: event.bannerImageUrl || '',
      requirements: event.requirements || [],
      prizes: event.prizes || [],
      rules: event.rules || [],
      isActive: event.isActive !== false
    })
    setShowModal(true)
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      category: '',
      date: '',
      time: '',
      venue: '',
      registrationFee: '',
      maxParticipants: '100',
      maxTeamSize: '1',
      maxTeams: '0',
      bannerImageUrl: '',
      requirements: [],
      prizes: [],
      rules: [],
      isActive: true
    })
    setSelectedEvent(null)
    setEditMode(false)
  }, [])

  // Form Schema Builder Functions
  const addField = useCallback(() => {
    setFormData({
      ...formData,
      formSchema: [
        ...formData.formSchema,
        { type: 'text', label: '', required: false, options: [] }
      ]
    })
  }, [formData])

  const updateField = useCallback((index, field) => {
    setFormData(prev => {
      const newSchema = [...prev.formSchema]
      newSchema[index] = field
      return { ...prev, formSchema: newSchema }
    })
  }, [])

  const removeField = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      formSchema: prev.formSchema.filter((_, i) => i !== index)
    }))
  }, [])

  const moveField = useCallback((index, direction) => {
    const newSchema = [...formData.formSchema]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newSchema.length) return
    
    [newSchema[index], newSchema[newIndex]] = [newSchema[newIndex], newSchema[index]]
    setFormData(prev => ({ ...prev, formSchema: newSchema }))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading events...</p>
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
              <Calendar className="w-6 h-6" />
              Event Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">Create and manage events with dynamic forms</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{event.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      event.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {event.category && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Registration Fee</p>
                      <p className="font-semibold text-gray-900">₹{event.registrationFee}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">{event.date || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Venue</p>
                      <p className="font-semibold text-gray-900">{event.venue || 'TBA'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(event.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={event.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {event.isActive ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(event)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No events created yet</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            // Close modal only if clicking the backdrop
            if (e.target === e.currentTarget) {
              setShowModal(false)
              resetForm()
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g. Code Sprint Championship"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    rows="4"
                    placeholder="Describe the event, what participants will learn or experience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                  <div className="flex items-start gap-3">
                    <label className="flex-1 flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingBanner ? (
                          <Loader2 className="w-10 h-10 text-gray-500 animate-spin mb-2" />
                        ) : (
                          <Upload className="w-10 h-10 text-gray-500 mb-2" />
                        )}
                        <p className="mb-1 text-sm text-gray-500">
                          {uploadingBanner ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF or WebP (max 5MB)</p>
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
                            const url = await uploadBannerImage(file, 'events')
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
                      <div className="rounded-lg overflow-hidden border border-gray-200 w-32 h-32 flex-shrink-0">
                        <img src={formData.bannerImageUrl} alt="Banner" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Upload from your PC. Image will be stored securely.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue / Location <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="e.g. Main Auditorium, Tech Lab 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData.registrationFee}
                      onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                      min="0"
                      placeholder="0 for free"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      min="1"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Size (1 = individual)</label>
                    <input
                      type="number"
                      value={formData.maxTeamSize}
                      onChange={(e) => setFormData({ ...formData, maxTeamSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Teams (if team event)</label>
                    <input
                      type="number"
                      value={formData.maxTeams}
                      onChange={(e) => setFormData({ ...formData, maxTeams: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      {EVENT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Rules</label>
                  <textarea
                    value={Array.isArray(formData.rules) ? formData.rules.join('\n') : (formData.rules || '')}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: e.target.value.split('\n').map(r => r.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    rows="5"
                    placeholder="Enter one rule per line, e.g.&#10;• Maximum 1 entry per participant&#10;• Laptop required&#10;• No external help allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter one rule per line. Rules will be displayed on the event detail page.</p>
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
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editMode ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default EventManagementPage
