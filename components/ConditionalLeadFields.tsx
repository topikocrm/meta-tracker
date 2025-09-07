'use client'

import { useState, useEffect } from 'react'
import { Phone, PhoneOff, AlertCircle, Calendar, MessageSquare, Target, CheckCircle } from 'lucide-react'
import { ContactStatus, InterestLevel, NextAction, FollowUpPriority, LeadStage, LOST_REASONS } from '@/lib/types'

interface ConditionalLeadFieldsProps {
  leadId: string
  initialData?: {
    contactStatus?: ContactStatus
    interestLevel?: InterestLevel
    lostReason?: string
    notQualifiedReason?: string
    nextAction?: NextAction
    followUpDate?: string
    followUpPriority?: FollowUpPriority
    leadStage?: LeadStage
  }
  onUpdate: (data: any) => Promise<void>
  isMobile?: boolean
}

export default function ConditionalLeadFields({
  leadId,
  initialData = {},
  onUpdate,
  isMobile = false
}: ConditionalLeadFieldsProps) {
  const [contactStatus, setContactStatus] = useState<ContactStatus>(initialData.contactStatus || 'not_attempted')
  const [interestLevel, setInterestLevel] = useState<InterestLevel | undefined>(initialData.interestLevel)
  const [lostReason, setLostReason] = useState(initialData.lostReason || '')
  const [notQualifiedReason, setNotQualifiedReason] = useState(initialData.notQualifiedReason || '')
  const [nextAction, setNextAction] = useState<NextAction | undefined>(initialData.nextAction)
  const [followUpDate, setFollowUpDate] = useState(initialData.followUpDate || '')
  const [followUpPriority, setFollowUpPriority] = useState<FollowUpPriority>(initialData.followUpPriority || 'medium')
  const [customReason, setCustomReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStage, setCurrentStage] = useState<LeadStage>(initialData.leadStage || 'new')

  // Handle contact status change
  const handleContactStatusChange = async (status: ContactStatus) => {
    setContactStatus(status)
    setIsUpdating(true)
    
    // Reset dependent fields
    if (status !== 'answered') {
      setInterestLevel(undefined)
      setLostReason('')
      setNotQualifiedReason('')
    }
    
    // Set default next actions and stage based on status
    let defaultNextAction: NextAction | undefined
    let newStage: string | undefined
    
    if (status === 'answered') {
      newStage = 'contacted'
    } else if (status === 'not_answered' || status === 'busy_call_later') {
      defaultNextAction = 'call_back'
    } else if (status === 'invalid_number' || status === 'do_not_call') {
      defaultNextAction = 'archive'
      newStage = 'lost'
    }
    
    if (defaultNextAction) {
      setNextAction(defaultNextAction)
    }
    
    const updateData: any = {
      contact_status: status,
      next_action: defaultNextAction,
      interest_level: status !== 'answered' ? null : interestLevel
    }
    
    if (newStage) {
      updateData.lead_stage = newStage
    }
    
    await onUpdate(updateData)
    
    setIsUpdating(false)
  }

  // Handle interest level change
  const handleInterestLevelChange = async (level: InterestLevel) => {
    setInterestLevel(level)
    setIsUpdating(true)
    
    // Set default next actions and stage based on interest
    let defaultNextAction: NextAction | undefined
    let newStage: string | undefined
    
    if (level === 'high') {
      defaultNextAction = 'schedule_demo'
      newStage = 'qualified'
    } else if (level === 'medium') {
      defaultNextAction = 'schedule_demo'
      newStage = 'qualified'
    } else if (level === 'low') {
      defaultNextAction = 'follow_up_later'
      newStage = 'nurturing'
    } else if (level === 'no_interest' || level === 'not_qualified') {
      defaultNextAction = 'archive'
      newStage = 'lost'
    }
    
    if (defaultNextAction) {
      setNextAction(defaultNextAction)
    }
    
    const updateData: any = {
      interest_level: level,
      next_action: defaultNextAction
    }
    
    if (newStage) {
      updateData.lead_stage = newStage
    }
    
    await onUpdate(updateData)
    
    setIsUpdating(false)
  }

  // Contact Status Cards
  const ContactStatusSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <Phone className="inline h-4 w-4 mr-1" />
        Contact Status
      </label>
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'} gap-2`}>
        <button
          onClick={() => handleContactStatusChange('answered')}
          className={`p-3 rounded-lg border-2 transition-all ${
            contactStatus === 'answered' 
              ? 'border-green-500 bg-green-50 text-green-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Phone className="h-5 w-5 mx-auto mb-1" />
          <div className="text-xs font-medium">Answered</div>
        </button>
        
        <button
          onClick={() => handleContactStatusChange('not_answered')}
          className={`p-3 rounded-lg border-2 transition-all ${
            contactStatus === 'not_answered' 
              ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <PhoneOff className="h-5 w-5 mx-auto mb-1" />
          <div className="text-xs font-medium">Not Answered</div>
        </button>
        
        <button
          onClick={() => handleContactStatusChange('busy_call_later')}
          className={`p-3 rounded-lg border-2 transition-all ${
            contactStatus === 'busy_call_later' 
              ? 'border-orange-500 bg-orange-50 text-orange-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Calendar className="h-5 w-5 mx-auto mb-1" />
          <div className="text-xs font-medium">Busy/Later</div>
        </button>
        
        <button
          onClick={() => handleContactStatusChange('invalid_number')}
          className={`p-3 rounded-lg border-2 transition-all ${
            contactStatus === 'invalid_number' 
              ? 'border-red-500 bg-red-50 text-red-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <AlertCircle className="h-5 w-5 mx-auto mb-1" />
          <div className="text-xs font-medium">Invalid</div>
        </button>
      </div>
    </div>
  )

  // Interest Level Selector (only if answered)
  const InterestLevelSelector = () => (
    <div className="space-y-3 animate-fadeIn">
      <label className="block text-sm font-medium text-gray-700">
        <Target className="inline h-4 w-4 mr-1" />
        Interest Level
      </label>
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
        <button
          onClick={() => handleInterestLevelChange('high')}
          className={`p-3 rounded-lg border-2 transition-all ${
            interestLevel === 'high' 
              ? 'border-red-500 bg-red-50 text-red-700 animate-pulse' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg mb-1">🔥</div>
          <div className="text-xs font-medium">High</div>
        </button>
        
        <button
          onClick={() => handleInterestLevelChange('medium')}
          className={`p-3 rounded-lg border-2 transition-all ${
            interestLevel === 'medium' 
              ? 'border-orange-500 bg-orange-50 text-orange-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg mb-1">☁️</div>
          <div className="text-xs font-medium">Medium</div>
        </button>
        
        <button
          onClick={() => handleInterestLevelChange('low')}
          className={`p-3 rounded-lg border-2 transition-all ${
            interestLevel === 'low' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg mb-1">🌡️</div>
          <div className="text-xs font-medium">Low</div>
        </button>
        
        <button
          onClick={() => handleInterestLevelChange('no_interest')}
          className={`p-3 rounded-lg border-2 transition-all ${
            interestLevel === 'no_interest' 
              ? 'border-gray-500 bg-gray-50 text-gray-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg mb-1">❌</div>
          <div className="text-xs font-medium">No Interest</div>
        </button>
        
        <button
          onClick={() => handleInterestLevelChange('not_qualified')}
          className={`p-3 rounded-lg border-2 transition-all ${
            interestLevel === 'not_qualified' 
              ? 'border-gray-500 bg-gray-50 text-gray-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg mb-1">⛔</div>
          <div className="text-xs font-medium">Not Qualified</div>
        </button>
      </div>
    </div>
  )

  // Lost/Not Qualified Reason (conditional)
  const ReasonSelector = () => {
    if (interestLevel !== 'no_interest' && interestLevel !== 'not_qualified' && interestLevel !== 'low') {
      return null
    }

    const reasons = interestLevel === 'not_qualified' 
      ? LOST_REASONS.filter(r => r.category === 'qualification')
      : LOST_REASONS

    return (
      <div className="space-y-3 animate-fadeIn">
        <label className="block text-sm font-medium text-gray-700">
          <AlertCircle className="inline h-4 w-4 mr-1" />
          {interestLevel === 'not_qualified' ? 'Not Qualified Reason' : 'Reason for Low/No Interest'}
        </label>
        <select
          value={interestLevel === 'not_qualified' ? notQualifiedReason : lostReason}
          onChange={(e) => {
            const value = e.target.value
            if (interestLevel === 'not_qualified') {
              setNotQualifiedReason(value)
              onUpdate({ not_qualified_reason: value })
            } else {
              setLostReason(value)
              onUpdate({ lost_reason: value })
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select reason...</option>
          {reasons.map(reason => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
        
        {(lostReason === 'other' || notQualifiedReason === 'other') && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Please specify..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        )}
      </div>
    )
  }

  // Follow-up Scheduler (for appropriate statuses)
  const FollowUpScheduler = () => {
    const showFollowUp = 
      contactStatus === 'not_answered' ||
      contactStatus === 'busy_call_later' ||
      interestLevel === 'medium' ||
      interestLevel === 'low'

    if (!showFollowUp) return null

    return (
      <div className="space-y-3 animate-fadeIn">
        <label className="block text-sm font-medium text-gray-700">
          <Calendar className="inline h-4 w-4 mr-1" />
          Schedule Follow-up
        </label>
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
          <input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => {
              setFollowUpDate(e.target.value)
              onUpdate({ follow_up_date: e.target.value })
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={followUpPriority}
            onChange={(e) => {
              setFollowUpPriority(e.target.value as FollowUpPriority)
              onUpdate({ follow_up_priority: e.target.value })
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="urgent">🔴 Urgent (24h)</option>
            <option value="high">🟠 High (2-3 days)</option>
            <option value="medium">🟡 Medium (Week)</option>
            <option value="low">🟢 Low (Month)</option>
          </select>
        </div>
      </div>
    )
  }

  // Handle next action change with pipeline progression
  const handleNextActionChange = async (action: NextAction) => {
    setNextAction(action)
    setIsUpdating(true)
    
    // Determine if pipeline should advance based on action
    let newStage: string | undefined
    
    if (action === 'schedule_demo') {
      newStage = 'demo_scheduled'
    } else if (action === 'send_information') {
      // Stay in current stage but mark as info sent
    } else if (action === 'create_trial') {
      newStage = 'trial_started'
    } else if (action === 'close_deal') {
      newStage = 'won'
    }
    
    const updateData: any = {
      next_action: action
    }
    
    if (newStage) {
      updateData.lead_stage = newStage
    }
    
    await onUpdate(updateData)
    setIsUpdating(false)
  }
  
  // Next Action Selector (always visible)
  const NextActionSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <MessageSquare className="inline h-4 w-4 mr-1" />
        Next Action
      </label>
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
        {['call_back', 'send_information', 'schedule_demo', 'create_trial', 'close_deal', 'follow_up_later', 'no_action'].map((action) => (
          <button
            key={action}
            onClick={() => handleNextActionChange(action as NextAction)}
            className={`p-2 rounded-lg border transition-all text-xs font-medium ${
              nextAction === action 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>
    </div>
  )

  // Handle demo completion
  const handleDemoCompleted = async () => {
    setIsUpdating(true)
    await onUpdate({
      lead_stage: 'demo_completed'
    })
    setCurrentStage('demo_completed')
    setIsUpdating(false)
  }
  
  return (
    <div className="space-y-6">
      <ContactStatusSelector />
      
      {contactStatus === 'answered' && (
        <>
          <InterestLevelSelector />
          <ReasonSelector />
        </>
      )}
      
      {/* Demo Completion Button - only show if in demo_scheduled stage */}
      {currentStage === 'demo_scheduled' && (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">Demo Scheduled</p>
              <p className="text-xs text-purple-700">Mark as completed when demo is done</p>
            </div>
            <button
              onClick={handleDemoCompleted}
              disabled={isUpdating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Demo Completed
            </button>
          </div>
        </div>
      )}
      
      <FollowUpScheduler />
      <NextActionSelector />
      
      {isUpdating && (
        <div className="text-sm text-gray-500 text-center animate-pulse">
          Updating...
        </div>
      )}
    </div>
  )
}