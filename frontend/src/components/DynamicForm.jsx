import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

const DynamicForm = ({ formSchema, onSubmit, submitLabel = 'Submit' }) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    formSchema.forEach(field => {
      if (field.required) {
        const value = formData[field.name]
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field.name] = `${field.label} is required`
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const renderField = (field) => {
    const value = formData[field.name] || ''
    const error = errors[field.name]
    
    const baseInputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
      error ? 'border-red-500' : 'border-gray-300'
    }`

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={baseInputClass}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            rows={field.rows || 4}
            className={baseInputClass}
          />
        )
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            min={field.min}
            max={field.max}
            className={baseInputClass}
          />
        )
      
      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => handleChange(field.name, e.target.files[0])}
            accept={field.accept}
            className={baseInputClass}
          />
        )
      
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={baseInputClass}
          />
        )
      
      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={baseInputClass}
          />
        )
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={baseInputClass}
          />
        )
    }
  }

  if (!formSchema || formSchema.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No form fields defined for this sub-event
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formSchema.map((field, index) => (
        <div key={index}>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.description && (
            <p className="text-sm text-gray-600 mb-2">{field.description}</p>
          )}
          
          {renderField(field)}
          
          {errors[field.name] && (
            <div className="flex items-center mt-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors[field.name]}
            </div>
          )}
        </div>
      ))}
      
      <button type="submit" className="btn-primary w-full">
        {submitLabel}
      </button>
    </form>
  )
}

export default DynamicForm
