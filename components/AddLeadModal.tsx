'use client'

import { useState } from 'react'
import { X, UserPlus, Phone, Mail, MapPin, Building } from 'lucide-react'

interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  sheetSource: 'sheet_1_food' | 'sheet_2_boutique'
  onLeadAdded: () => void
}

export default function AddLeadModal({ 
  isOpen, 
  onClose, 
  sheetSource,
  onLeadAdded 
}: AddLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    business_name: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required'
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      newErrors.phone_number = 'Please enter a valid 10-digit phone number'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/leads/manual-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sheet_source: sheetSource,
          is_managed: true,
          lead_stage: 'new',
          lead_quality: 'warm',
          created_time: new Date().toISOString(),
          row_number: null,
          manually_added: true
        })
      })
      
      const data = await response.json()
      if (data.success) {
        onLeadAdded()
        onClose()
        // Reset form
        setFormData({
          full_name: '',
          phone_number: '',
          email: '',
          business_name: '',
          address: '',
          city: '',
          state: '',
          pincode: ''
        })
      } else {
        setErrors({ submit: data.error || 'Failed to add lead' })
      }
    } catch (error) {
      console.error('Failed to add lead:', error)
      setErrors({ submit: 'Failed to add lead. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Add New {sheetSource === 'sheet_1_food' ? 'Food' : 'Boutique'} Lead
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name and Phone (Required) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.full_name && (
                <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10-digit phone number"
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500 mt-1">{errors.phone_number}</p>
              )}
            </div>
          </div>

          {/* Email and Business Name (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="inline h-4 w-4 mr-1" />
                Business Name
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Business or company name"
              />
            </div>
          </div>

          {/* Address Information (Optional) */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  placeholder="Pincode"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}