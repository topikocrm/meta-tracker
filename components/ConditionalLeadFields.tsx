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
    informationSent?: boolean
    waitingForResponse?: boolean
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
  const [informationSent, setInformationSent] = useState(initialData.informationSent || false)
  const [waitingForResponse, setWaitingForResponse] = useState(initialData.waitingForResponse || false)
  
  // Update currentStage when initialData changes (e.g., after API update)
  useEffect(() => {
    if (initialData.leadStage) {
      setCurrentStage(initialData.leadStage)
    }
  }, [initialData.leadStage])

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
    let newStage: LeadStage | undefined
    
    if (status === 'answered') {
      newStage = 'contacted'
    } else if (status === 'not_answered' || status === 'busy_call_later') {
      defaultNextAction = 'call_back'
      newStage = 'contacted' // Update stage to contacted for these statuses too
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
      interest_level: status !== 'answered' ? null : interestLevel,
      last_contact_date: new Date().toISOString() // Track last contact date
    }
    
    if (newStage) {
      updateData.lead_stage = newStage
      setCurrentStage(newStage) // Update local state
    }
    
    await onUpdate(updateData)
    
    setIsUpdating(false)
  }

  // Handle interest level change
  const handleInterestLevelChange = async (level: InterestLevel) => {
    setInterestLevel(level)
    setIsUpdating(true)
    
    // Set stage based on interest but don't force a specific action
    let newStage: LeadStage | undefined
    
    if (level === 'high' || level === 'medium') {
      newStage = 'qualified' // They're interested, now user chooses the path
    } else if (level === 'low') {
      newStage = 'nurturing'
    } else if (level === 'no_interest' || level === 'not_qualified') {
      newStage = 'lost'
    }
    
    const updateData: any = {
      interest_level: level,
      last_contact_date: new Date().toISOString()
    }
    
    if (newStage) {
      updateData.lead_stage = newStage
      setCurrentStage(newStage)
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
    
    // Initialize update data
    const updateData: any = {
      next_action: action
    }
    
    // Determine if pipeline should advance based on action
    let newStage: LeadStage | undefined
    
    if (action === 'schedule_demo') {
      newStage = 'demo_scheduled'
    } else if (action === 'send_information') {
      // Stay in current stage but mark as info sent and set waiting period
      setInformationSent(true)
      setWaitingForResponse(true)
      // Set follow-up date to 2 days from now by default
      const followUpDateValue = new Date()
      followUpDateValue.setDate(followUpDateValue.getDate() + 2)
      setFollowUpDate(followUpDateValue.toISOString().slice(0, 16))
      setFollowUpPriority('high')
      
      updateData.information_sent = true
      updateData.waiting_for_response = true
      updateData.follow_up_date = followUpDateValue.toISOString().slice(0, 16)
      updateData.follow_up_priority = 'high'
    } else if (action === 'create_trial') {
      newStage = 'trial_started'
    } else if (action === 'close_deal') {
      newStage = 'won'
    }
    
    if (newStage) {
      updateData.lead_stage = newStage
      setCurrentStage(newStage) // Update local state immediately
    }
    
    
    await onUpdate(updateData)
    setIsUpdating(false)
  }
  
  // Flexible Next Action Selector - All options available after interest is determined
  const NextActionSelector = () => {
    // Determine which actions to show based on interest level and current stage
    let primaryActions: NextAction[] = []
    let secondaryActions: NextAction[] = ['call_back', 'follow_up_later', 'no_action']
    
    // If interest level is determined, show all primary actions
    if (interestLevel && interestLevel !== 'no_interest' && interestLevel !== 'not_qualified') {
      // All primary actions available - user can choose any path
      primaryActions = ['schedule_demo', 'send_information', 'create_trial']
      
      // If in trial or later stages, also show close deal
      if (currentStage === 'trial_started' || currentStage === 'demo_completed') {
        primaryActions.push('close_deal')
      }
    } else if (currentStage === 'contacted' || currentStage === 'new') {
      // Before interest is determined, only basic actions
      primaryActions = ['send_information']
    }
    
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <MessageSquare className="inline h-4 w-4 mr-1" />
          Next Action
        </label>
        
        {/* Primary Actions - Stage Specific */}
        {primaryActions.length > 0 && (
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-3`}>
            {primaryActions.map((action) => (
              <button
                key={action}
                onClick={() => handleNextActionChange(action)}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  nextAction === action 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-blue-200 hover:border-blue-300 bg-blue-50'
                }`}
              >
                {action === 'schedule_demo' && '📅 '}
                {action === 'send_information' && '📧 '}
                {action === 'create_trial' && '🧪 '}
                {action === 'close_deal' && '🎉 '}
                {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        )}
        
        {/* Secondary Actions - Always Available */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
          {secondaryActions.map((action) => (
            <button
              key={action}
              onClick={() => handleNextActionChange(action)}
              className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                nextAction === action 
                  ? 'border-gray-500 bg-gray-50 text-gray-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Handle demo completion
  const handleDemoCompleted = async () => {
    setIsUpdating(true)
    await onUpdate({
      lead_stage: 'demo_completed'
    })
    setCurrentStage('demo_completed')
    setIsUpdating(false)
  }
  
  // Handle response after information sent
  const handleInfoResponse = async (response: 'interested' | 'not_interested' | 'no_response') => {
    setIsUpdating(true)
    setWaitingForResponse(false)
    
    let updateData: any = {}
    
    if (response === 'interested') {
      // Move to qualified or demo scheduled based on current stage
      if (currentStage === 'new' || currentStage === 'contacted') {
        updateData.lead_stage = 'qualified'
        updateData.interest_level = 'medium'
        setCurrentStage('qualified')
        setInterestLevel('medium')
      }
      updateData.next_action = 'schedule_demo'
      updateData.waiting_for_response = false
    } else if (response === 'not_interested') {
      updateData.interest_level = 'no_interest'
      updateData.lead_stage = 'lost'
      updateData.lost_reason = 'not_interested_after_info'
      updateData.waiting_for_response = false
      setCurrentStage('lost')
      setInterestLevel('no_interest')
    } else if (response === 'no_response') {
      // Keep following up, extend deadline
      const newFollowUp = new Date()
      newFollowUp.setDate(newFollowUp.getDate() + 3)
      updateData.next_action = 'follow_up_later'
      updateData.follow_up_date = newFollowUp.toISOString().slice(0, 16)
      updateData.contact_attempts = 1
      setFollowUpDate(newFollowUp.toISOString().slice(0, 16))
    }
    
    await onUpdate(updateData)
    setIsUpdating(false)
  }
  
  return (
    <div className="space-y-6">
      {/* Current Stage Indicator */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Current Stage</p>
            <p className="text-lg font-semibold text-blue-900">
              {currentStage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
          {informationSent && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Info Sent
            </div>
          )}
        </div>
        <p className="text-xs text-blue-700 mt-2">
          {currentStage === 'new' && 'Make first contact with the lead'}
          {currentStage === 'contacted' && 'Assess interest and qualify the lead'}
          {currentStage === 'qualified' && 'Schedule a demo to showcase your product'}
          {currentStage === 'demo_scheduled' && 'Conduct the demo and mark as completed'}
          {currentStage === 'demo_completed' && 'Start a trial or close the deal'}
          {currentStage === 'trial_started' && 'Support the trial and work towards closing'}
          {currentStage === 'won' && '🎉 Deal closed successfully!'}
        </p>
      </div>
      
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
      
      {/* Information Response Section - show after info sent */}
      {informationSent && waitingForResponse && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-blue-900">📧 Information Sent</p>
              <p className="text-xs text-blue-700">Waiting for lead response. Follow up scheduled for {followUpDate ? new Date(followUpDate).toLocaleDateString() : '2 days'}.</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-blue-800">Lead Response:</p>
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-2`}>
                <button
                  onClick={() => handleInfoResponse('interested')}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  👍 Interested
                </button>
                <button
                  onClick={() => handleInfoResponse('not_interested')}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  👎 Not Interested
                </button>
                <button
                  onClick={() => handleInfoResponse('no_response')}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
                >
                  😶 No Response
                </button>
              </div>
            </div>
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