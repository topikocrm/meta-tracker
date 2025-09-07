// Lead tracking types for the comprehensive CRM system

export type ContactStatus = 
  | 'not_attempted'
  | 'answered'
  | 'not_answered'
  | 'busy_call_later'
  | 'invalid_number'
  | 'not_reachable'
  | 'do_not_call';

export type InterestLevel = 
  | 'high'
  | 'medium'
  | 'low'
  | 'no_interest'
  | 'not_qualified';

export type LeadStage = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'demo_scheduled'
  | 'demo_completed'
  | 'trial_started'
  | 'proposal_sent'
  | 'negotiation'
  | 'contract_sent'
  | 'won'
  | 'lost'
  | 'on_hold'
  | 'nurturing';

export type LeadQuality = 
  | 'hot'
  | 'warm'
  | 'cool'
  | 'cold';

export type FollowUpPriority = 
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low'
  | 'none';

export type NextAction = 
  | 'call_back'
  | 'send_information'
  | 'schedule_demo'
  | 'create_trial'
  | 'send_proposal'
  | 'follow_up_later'
  | 'close_deal'
  | 'no_action'
  | 'archive';

export interface Lead {
  id: string;
  google_sheet_id?: string;
  created_time?: string;
  full_name?: string;
  phone_number?: string;
  whatsapp_number?: string;
  email?: string;
  state?: string;
  city?: string;
  
  // Campaign info
  campaign_name?: string;
  ad_name?: string;
  form_name?: string;
  
  // Legacy status (keeping for compatibility)
  current_status?: 'new' | 'contacted' | 'interested' | 'demo' | 'negotiation' | 'won' | 'lost';
  
  // New comprehensive tracking fields
  contact_status: ContactStatus;
  interest_level?: InterestLevel;
  lead_stage: LeadStage;
  lead_quality: LeadQuality;
  
  // Lost/Not qualified reasons
  lost_reason?: string;
  not_qualified_reason?: string;
  
  // Follow-up management
  next_action?: NextAction;
  follow_up_date?: string;
  follow_up_priority: FollowUpPriority;
  
  // Tracking metrics
  last_contact_date?: string;
  contact_attempts: number;
  stage_entered_date?: string;
  days_in_stage?: number;
  pipeline_progress: number;
  
  // CRM fields
  assigned_to?: string;
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  
  // Meta fields
  sheet_source?: string;
  row_number?: number;
  is_managed: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Additional data
  tool_requirement?: string;
  additional_data?: any;
  
  // Temporary flags (not stored in DB)
  _isNew?: boolean;
  _rowNumber?: number;
  _sheetId?: string;
  _sheetName?: string;
  _sheetSource?: string;
  _allFields?: any;
}

// Stage configuration with metadata
export interface StageConfig {
  icon: string;
  label: string;
  color: string;
  progress: number;
  nextAction: string;
  successCriteria: string;
  description: string;
}

export const STAGE_CONFIGS: Record<LeadStage, StageConfig> = {
  new: {
    icon: '🆕',
    label: 'New',
    color: 'gray',
    progress: 0,
    nextAction: 'Make first contact',
    successCriteria: 'Lead acknowledged',
    description: 'Fresh lead, not contacted yet'
  },
  contacted: {
    icon: '📞',
    label: 'Contacted',
    color: 'blue',
    progress: 20,
    nextAction: 'Assess interest level',
    successCriteria: 'Interest level determined',
    description: 'Initial contact made'
  },
  qualified: {
    icon: '✅',
    label: 'Qualified',
    color: 'green',
    progress: 40,
    nextAction: 'Schedule demo/meeting',
    successCriteria: 'Demo scheduled',
    description: 'Lead qualified and interested'
  },
  demo_scheduled: {
    icon: '📅',
    label: 'Demo Scheduled',
    color: 'purple',
    progress: 55,
    nextAction: 'Prepare and conduct demo',
    successCriteria: 'Demo conducted',
    description: 'Demo appointment set - Click "Schedule Demo" in Next Action to reach here'
  },
  demo_completed: {
    icon: '🖥️',
    label: 'Demo Done',
    color: 'indigo',
    progress: 70,
    nextAction: 'Get feedback and start trial',
    successCriteria: 'Trial started or deal closed',
    description: 'Demo completed - Mark demo as done to advance'
  },
  trial_started: {
    icon: '🧪',
    label: 'Trial',
    color: 'orange',
    progress: 85,
    nextAction: 'Support trial, close deal',
    successCriteria: 'Deal closed',
    description: 'Trial in progress - Click "Create Trial" in Next Action to reach here'
  },
  // Hidden stages - kept for backward compatibility but not shown in UI
  proposal_sent: {
    icon: '📄',
    label: 'Proposal',
    color: 'yellow',
    progress: 75,
    nextAction: 'Follow up on proposal',
    successCriteria: 'Terms agreed',
    description: 'Commercial proposal sent'
  },
  negotiation: {
    icon: '💬',
    label: 'Negotiation',
    color: 'amber',
    progress: 85,
    nextAction: 'Finalize terms',
    successCriteria: 'Agreement reached',
    description: 'Negotiating terms'
  },
  contract_sent: {
    icon: '📝',
    label: 'Contract',
    color: 'red',
    progress: 90,
    nextAction: 'Get signature',
    successCriteria: 'Contract signed',
    description: 'Contract sent for signature'
  },
  won: {
    icon: '🎉',
    label: 'Won',
    color: 'emerald',
    progress: 100,
    nextAction: 'Onboard customer',
    successCriteria: 'Customer active',
    description: 'Deal closed - Click "Close Deal" in Next Action to win'
  },
  lost: {
    icon: '❌',
    label: 'Lost',
    color: 'gray',
    progress: 0,
    nextAction: 'Document reason',
    successCriteria: 'Learning captured',
    description: 'Lead did not convert'
  },
  on_hold: {
    icon: '⏸️',
    label: 'On Hold',
    color: 'slate',
    progress: -1,
    nextAction: 'Check back later',
    successCriteria: 'Reactivate when ready',
    description: 'Temporarily paused'
  },
  nurturing: {
    icon: '🌱',
    label: 'Nurturing',
    color: 'teal',
    progress: -1,
    nextAction: 'Send nurture content',
    successCriteria: 'Re-engage when ready',
    description: 'Long-term nurture'
  }
};

// Lead quality configuration
export const QUALITY_CONFIGS: Record<LeadQuality, { icon: string; label: string; color: string; description: string }> = {
  hot: {
    icon: '🔥',
    label: 'HOT',
    color: 'red',
    description: 'High interest, ready to close'
  },
  warm: {
    icon: '☁️',
    label: 'WARM',
    color: 'orange',
    description: 'Interested, needs nurturing'
  },
  cool: {
    icon: '🌡️',
    label: 'COOL',
    color: 'blue',
    description: 'Some interest, long-term'
  },
  cold: {
    icon: '🧊',
    label: 'COLD',
    color: 'gray',
    description: 'No interest or unresponsive'
  }
};

// Lost reason options
export const LOST_REASONS = [
  { value: 'budget', label: 'Budget Constraints', category: 'financial' },
  { value: 'competitor', label: 'Went with Competitor', category: 'competition' },
  { value: 'not_ready', label: 'Not Ready to Buy', category: 'timing' },
  { value: 'no_fit', label: 'Product Not Suitable', category: 'product' },
  { value: 'location', label: 'Location/Delivery Issue', category: 'logistics' },
  { value: 'size_small', label: 'Business Too Small', category: 'qualification' },
  { value: 'size_large', label: 'Business Too Large', category: 'qualification' },
  { value: 'wrong_type', label: 'Different Business Type', category: 'qualification' },
  { value: 'browsing', label: 'Just Browsing/Research', category: 'interest' },
  { value: 'no_decision_maker', label: 'Decision Maker Not Available', category: 'process' },
  { value: 'no_response', label: 'No Response After Multiple Attempts', category: 'engagement' },
  { value: 'other', label: 'Other Reason', category: 'other' }
];

// Helper functions
export function getStageProgress(stage: LeadStage): number {
  return STAGE_CONFIGS[stage].progress;
}

export function getQualityFromStage(stage: LeadStage, interestLevel?: InterestLevel): LeadQuality {
  if (interestLevel === 'high' || ['demo_completed', 'trial_started', 'proposal_sent', 'negotiation', 'contract_sent'].includes(stage)) {
    return 'hot';
  }
  if (interestLevel === 'medium' || ['qualified', 'demo_scheduled'].includes(stage)) {
    return 'warm';
  }
  if (interestLevel === 'low' || stage === 'contacted') {
    return 'cool';
  }
  return 'cold';
}