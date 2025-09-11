'use client'

import React, { useState, useEffect } from 'react'
import { X, Phone, Mail, MapPin, Calendar, User, MessageSquare, Info, ShoppingBag, Clock, Save, UserPlus, Activity, Target, TrendingUp } from 'lucide-react'
import { Lead, LeadStage } from '@/lib/types'
import LeadQualityBadge from './LeadQualityBadge'
import PipelineStageTracker from './PipelineStageTracker'
import ConditionalLeadFields from './ConditionalLeadFields'
import StatusBadge from './StatusBadge'
import AssignmentSelector from './AssignmentSelector'
import CommentSection from './CommentSection'

interface EnhancedLeadModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
  onUpdate?: (updatedLead: Partial<Lead>) => void
}

export default function EnhancedLeadModal({ 
  lead, 
  isOpen, 
  onClose,
  onUpdate 
}: EnhancedLeadModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isSaving, setIsSaving] = useState(false)
  // Ensure lead has proper stage field
  const initialLeadData = {
    ...lead,
    lead_stage: lead.lead_stage || 'new',
    contact_status: lead.contact_status || lead.current_status || 'new',
    lead_quality: lead.lead_quality || 'cold'
  }
  const [leadData, setLeadData] = useState(initialLeadData)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Parse additional data if it exists
  const additionalData = lead.additional_data || (lead.tool_requirement ? JSON.parse(lead.tool_requirement) : {})
  
  useEffect(() => {
    const updatedLeadData = {
      ...lead,
      lead_stage: lead.lead_stage || 'new',
      contact_status: lead.contact_status || lead.current_status || 'new',
      lead_quality: lead.lead_quality || 'cold'
    }
    setLeadData(updatedLeadData)
  }, [lead])
  
  const handleFieldUpdate = async (updates: Partial<Lead>) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadData.id,
          ...updates
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        // Use the updated lead from the server response which includes calculated fields
        if (result.lead) {
          setLeadData(result.lead)
          onUpdate?.(result.lead)
        } else {
          // Fallback to local update if server doesn't return the lead
          const updatedLead = { ...leadData, ...updates }
          setLeadData(updatedLead)
          onUpdate?.(updates)
        }
      }
    } catch (error) {
      console.error('Failed to update lead:', error)
    }
    setIsSaving(false)
  }
  
  const handleStageChange = async (newStage: LeadStage) => {
    await handleFieldUpdate({ lead_stage: newStage })
  }
  
  const handleAssignment = async (userId: string) => {
    await handleFieldUpdate({ assigned_to: userId || undefined })
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
      }
    } catch (error) {
      console.error('Failed to import lead:', error)
    }
    setIsSaving(false)
  }
  
  if (!isOpen) return null
  
  const isNewLead = lead._isNew || !lead.id
  
  // Calculate metrics
  const daysSinceCreation = leadData.created_time 
    ? Math.floor((Date.now() - new Date(leadData.created_time).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  const tabs = isMobile 
    ? ['overview', 'tracking', 'activity']
    : ['overview', 'tracking', 'crm', 'activity', 'details']
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
        isMobile ? 'max-w-full' : 'max-w-5xl'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <div className="p-2 bg-white/20 rounded-lg hidden sm:block">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {leadData.full_name || 'Lead Details'}
                </h2>
                <LeadQualityBadge 
                  quality={leadData.lead_quality} 
                  size={isMobile ? 'sm' : 'md'} 
                  showLabel={!isMobile}
                />
              </div>
              <p className="text-blue-100 text-xs sm:text-sm">
                {leadData.sheet_source === 'sheet_1_food' ? 'Food Lead' : 
                 leadData.sheet_source === 'sheet_2_boutique' ? 'Boutique Lead' : 
                 'Services Lead'}
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
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium text-sm">
                  Import to enable CRM features
                </span>
              </div>
              <button
                onClick={handleImportLead}
                disabled={isSaving}
                className="px-3 sm:px-4 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm"
              >
                Import
              </button>
            </div>
          </div>
        )}
        
        {/* Pipeline Progress */}
        {!isNewLead && (
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
            <PipelineStageTracker 
              currentStage={leadData.lead_stage}
              // Removed onStageClick to prevent manual stage changes - stages now only advance through Track tab
              variant={isMobile ? 'mobile' : 'full'}
              showProgress={true}
            />
          </div>
        )}
        
        {/* Tabs */}
        <div className="border-b border-gray-200 px-4 sm:px-6 overflow-x-auto">
          <nav className="flex gap-4 sm:gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'tracking' ? 'Track' : tab}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {leadData.contact_attempts || 0}
                  </div>
                  <div className="text-xs text-gray-500">Attempts</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xl sm:text-2xl font-bold text-blue-900">
                    {leadData.days_in_stage || 0}
                  </div>
                  <div className="text-xs text-gray-500">Days in Stage</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xl sm:text-2xl font-bold text-green-900">
                    {daysSinceCreation}
                  </div>
                  <div className="text-xs text-gray-500">Total Days</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xl sm:text-2xl font-bold text-purple-900">
                    {leadData.pipeline_progress}%
                  </div>
                  <div className="text-xs text-gray-500">Progress</div>
                </div>
              </div>
              
              {/* Last Contact Info */}
              {leadData.last_contact_date && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Last Contacted:</span>
                    </div>
                    <span className="text-sm text-yellow-700">
                      {new Date(leadData.last_contact_date).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
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
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {leadData.created_time ? new Date(leadData.created_time).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => leadData.phone_number && window.open(`tel:${leadData.phone_number}`)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={!leadData.phone_number}
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Call</span>
                </button>
                <button
                  onClick={() => {
                    if (leadData.phone_number) {
                      const phone = leadData.phone_number.replace(/[^\d]/g, '')
                      window.open(`https://wa.me/${phone}`)
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={!leadData.phone_number}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'tracking' && (
            <div>
              {!isNewLead ? (
                <ConditionalLeadFields
                  leadId={leadData.id}
                  initialData={{
                    contactStatus: leadData.contact_status,
                    interestLevel: leadData.interest_level,
                    lostReason: leadData.lost_reason,
                    notQualifiedReason: leadData.not_qualified_reason,
                    nextAction: leadData.next_action,
                    followUpDate: leadData.follow_up_date,
                    followUpPriority: leadData.follow_up_priority,
                    leadStage: leadData.lead_stage,
                    demo_date: leadData.demo_date || leadData.additional_data?.demo_date,
                    demo_time: leadData.demo_time || leadData.additional_data?.demo_time,
                    demo_type: leadData.demo_type || leadData.additional_data?.demo_type,
                    demo_location: leadData.demo_location || leadData.additional_data?.demo_location,
                    demo_notes: leadData.demo_notes || leadData.additional_data?.demo_notes,
                    demo_presenter: leadData.demo_presenter || leadData.additional_data?.demo_presenter
                  }}
                  onUpdate={handleFieldUpdate}
                  isMobile={isMobile}
                />
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Import this lead to access tracking features</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'crm' && !isMobile && (
            <div className="space-y-6">
              {!isNewLead ? (
                <>
                  {/* Assignment */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Assignment</h3>
                    <AssignmentSelector
                      currentAssignee={leadData.assigned_to}
                      leadId={leadData.id}
                      onAssign={handleAssignment}
                    />
                  </div>
                  
                  {/* Follow-up Management */}
                  {leadData.follow_up_date && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Follow-up Scheduled</h3>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              {new Date(leadData.follow_up_date).toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-700 capitalize">
                              Priority: {leadData.follow_up_priority}
                            </p>
                          </div>
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Import this lead to access CRM features</p>
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
                  <p className="text-gray-500">Import this lead to track activity</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'details' && !isMobile && (
            <div className="space-y-4 max-h-full">
              <h3 className="font-medium text-gray-900">All Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                <dl className="space-y-3">
                  {Object.entries({ ...leadData, ...additionalData }).map(([key, value]) => {
                    if (['id', '_isNew', 'tool_requirement', 'additional_data', 'assigned_user'].includes(key)) return null
                    if (!value) return null
                    
                    const displayKey = key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                    
                    return (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <dt className="text-sm font-medium text-gray-500 break-words">{displayKey}</dt>
                        <dd className="text-sm text-gray-900 col-span-2 break-words">{String(value)}</dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        {isSaving && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
            <p className="text-sm text-blue-600 text-center animate-pulse">
              Saving changes...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}