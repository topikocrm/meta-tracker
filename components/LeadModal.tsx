'use client'

import React, { useState, useEffect } from 'react'
import { X, Phone, Mail, MapPin, Calendar, User, MessageSquare, Info, ShoppingBag, Clock, Save, UserPlus } from 'lucide-react'
import StatusSelector from './StatusSelector'
import AssignmentSelector from './AssignmentSelector'
import CommentSection from './CommentSection'
import StatusBadge from './StatusBadge'

interface LeadModalProps {
  lead: any
  isOpen: boolean
  onClose: () => void
}

export default function LeadModal({ lead, isOpen, onClose }: LeadModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [leadData, setLeadData] = useState(lead)
  const [followupDate, setFollowupDate] = useState(lead.followup_date || '')
  
  // Parse additional data if it exists
  const additionalData = lead.additional_data || (lead.tool_requirement ? JSON.parse(lead.tool_requirement) : {})
  
  useEffect(() => {
    setLeadData(lead)
    setFollowupDate(lead.followup_date || '')
  }, [lead])
  
  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadData.id,
          current_status: newStatus
        })
      })
      
      if (response.ok) {
        setLeadData({ ...leadData, current_status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
    setIsSaving(false)
  }
  
  const handleAssignment = async (userId: string) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadData.id,
          assigned_to: userId || null
        })
      })
      
      if (response.ok) {
        setLeadData({ ...leadData, assigned_to: userId })
      }
    } catch (error) {
      console.error('Failed to update assignment:', error)
    }
    setIsSaving(false)
  }
  
  const handleSaveFollowup = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadData.id,
          followup_date: followupDate || null
        })
      })
      
      if (response.ok) {
        setLeadData({ ...leadData, followup_date: followupDate })
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update followup date:', error)
    }
    setIsSaving(false)
  }
  
  const handleImportLead = async () => {
    if (!lead._isNew) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/leads/quick-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          initialStatus: 'new'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setLeadData(data.lead)
        // Lead is now managed
      }
    } catch (error) {
      console.error('Failed to import lead:', error)
    }
    setIsSaving(false)
  }
  
  if (!isOpen) return null
  
  const isNewLead = lead._isNew || !lead.id
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {leadData.full_name || 'Lead Details'}
              </h2>
              <p className="text-blue-100 text-sm">
                {leadData.sheet_source === 'sheet_1_food' ? 'Food Lead' : 'Boutique Lead'}
                {isNewLead && ' - Not Imported Yet'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        
        {/* Import Banner for New Leads */}
        {isNewLead && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  This lead needs to be imported to enable CRM features
                </span>
              </div>
              <button
                onClick={handleImportLead}
                disabled={isSaving}
                className="px-4 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Import & Start Managing
              </button>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-6">
            {['overview', 'crm', 'activity', 'details'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {leadData.phone_number || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {leadData.email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">
                        {leadData.state || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Created On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {leadData.created_time ? new Date(leadData.created_time).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Business Information */}
              {(additionalData.category || additionalData.business_type) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {additionalData.category && (
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Category</p>
                          <p className="text-sm font-medium text-gray-900">
                            {additionalData.category}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {additionalData.business_type && (
                      <div className="flex items-start gap-3">
                        <ShoppingBag className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Business Type</p>
                          <p className="text-sm font-medium text-gray-900">
                            {additionalData.business_type}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (leadData.phone_number) {
                      window.open(`tel:${leadData.phone_number}`, '_blank')
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={!leadData.phone_number}
                >
                  <Phone className="h-4 w-4" />
                  Call Lead
                </button>
                <button
                  onClick={() => {
                    if (leadData.phone_number) {
                      const phone = leadData.phone_number.replace(/[^\d]/g, '')
                      window.open(`https://wa.me/${phone}`, '_blank')
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!leadData.phone_number}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'crm' && (
            <div className="space-y-6">
              {!isNewLead ? (
                <>
                  {/* Status Management */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Lead Status</h3>
                    <StatusSelector
                      currentStatus={leadData.current_status}
                      leadId={leadData.id}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                  
                  {/* Assignment */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Assignment</h3>
                    <AssignmentSelector
                      currentAssignee={leadData.assigned_to}
                      leadId={leadData.id}
                      onAssign={handleAssignment}
                    />
                  </div>
                  
                  {/* Follow-up Date */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Follow-up Date</h3>
                    <div className="flex items-center gap-3">
                      <input
                        type="datetime-local"
                        value={followupDate}
                        onChange={(e) => setFollowupDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSaveFollowup}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Import this lead to access CRM features</p>
                  <button
                    onClick={handleImportLead}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Import Lead
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div>
              {!isNewLead && leadData.id ? (
                <CommentSection leadId={leadData.id} />
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Import this lead to add comments and track activity</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">All Lead Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="space-y-3">
                  {Object.entries({ ...leadData, ...additionalData }).map(([key, value]) => {
                    if (['id', '_isNew', '_rowNumber', '_sheetSource', '_sheetName', '_sheetId', '_allFields', 'tool_requirement', 'additional_data', 'assigned_user'].includes(key)) return null
                    if (!value) return null
                    
                    const displayKey = key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                    
                    return (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <dt className="text-sm font-medium text-gray-500">{displayKey}</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{String(value)}</dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}