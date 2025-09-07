export type UserRole = 'admin' | 'manager' | 'user'
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'demo' | 'negotiation' | 'won' | 'lost'
export type InteractionType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'other'
export type LeadQuality = 'hot' | 'warm' | 'cool' | 'cold'
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'demo_scheduled' | 'demo_completed' | 'trial_started' | 'won' | 'lost' | 'on_hold' | 'nurturing'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  google_sheet_id?: string
  created_time: string
  full_name?: string
  phone_number?: string
  whatsapp_number?: string
  email?: string
  state?: string
  city?: string
  campaign_id?: string
  campaign_name?: string
  adset_id?: string
  adset_name?: string
  ad_id?: string
  ad_name?: string
  form_id?: string
  form_name?: string
  platform?: string
  is_organic: boolean
  tool_requirement?: string
  assigned_to?: string
  assigned_user?: User
  current_status: LeadStatus
  lead_quality?: LeadQuality
  lead_stage?: LeadStage
  contact_status?: string
  interest_level?: string
  lost_reason_id?: string
  lost_reason?: LostReason
  lost_reason_text?: string
  not_qualified_reason?: string
  next_action?: string
  follow_up_date?: string
  follow_up_priority?: string
  last_contact_date?: string
  contact_attempts?: number
  stage_entered_date?: string
  days_in_stage?: number
  pipeline_progress?: number
  is_managed?: boolean
  row_number?: number
  conversion_value?: number
  sheet_source?: string
  created_at: string
  updated_at: string
}

export interface LeadStatusHistory {
  id: string
  lead_id: string
  previous_status?: LeadStatus
  new_status: LeadStatus
  changed_by?: string
  changed_by_user?: User
  changed_at: string
  time_in_status?: string
}

export interface LeadInteraction {
  id: string
  lead_id: string
  interaction_type: InteractionType
  description?: string
  created_by?: string
  created_by_user?: User
  created_at: string
}

export interface LeadNote {
  id: string
  lead_id: string
  note: string
  created_by?: string
  created_by_user?: User
  created_at: string
}

export interface LostReason {
  id: string
  reason: string
  category?: string
  is_active: boolean
  created_at: string
}

export interface SyncLog {
  id: string
  sheet_id?: string
  sheet_name?: string
  sync_type?: string
  records_processed?: number
  records_added?: number
  records_updated?: number
  status?: string
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface LeadConversionMetrics {
  user_id: string
  user_name: string
  total_leads: number
  won_leads: number
  lost_leads: number
  active_leads: number
  conversion_rate: number
  total_revenue?: number
}

export interface CampaignPerformance {
  campaign_name: string
  total_leads: number
  conversions: number
  conversion_rate: number
  total_value?: number
}