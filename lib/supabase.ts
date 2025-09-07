import { createClient } from '@supabase/supabase-js'

// Hardcoded values to bypass environment variable issues
const supabaseUrl = 'https://nnituwulsjzoucbeuele.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uaXR1d3Vsc2p6b3VjYmV1ZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTc1NTYsImV4cCI6MjA3MjczMzU1Nn0.J1_ey_2GMdryzoRdHcH6Z79WtJExb4h-9CKSiXKcJtE'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uaXR1d3Vsc2p6b3VjYmV1ZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE1NzU1NiwiZXhwIjoyMDcyNzMzNTU2fQ.NNd551KAqN1k7XzEdxhyb1qFXpLBpKURf3inE8mcYyw'

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role (for admin operations)
export const createServerSupabase = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Types for our database tables
export interface Lead {
  id: string
  google_sheet_id?: string
  created_time?: string
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
  is_organic?: boolean
  tool_requirement?: string
  assigned_to?: string
  current_status?: 'new' | 'contacted' | 'interested' | 'demo' | 'negotiation' | 'won' | 'lost'
  lost_reason_id?: string
  conversion_value?: number
  sheet_source?: string
  created_at?: string
  updated_at?: string
  followup_date?: string
  // Additional fields from sheets
  category?: string
  business_type?: string
  comments?: string
  [key: string]: any // For additional dynamic fields
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'admin' | 'manager' | 'user'
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LeadNote {
  id: string
  lead_id: string
  note: string
  created_by: string
  created_at: string
  user?: User // Joined data
}

export interface LeadStatusHistory {
  id: string
  lead_id: string
  previous_status?: string
  new_status: string
  changed_by: string
  changed_at: string
  time_in_status?: string
  user?: User // Joined data
}

export interface LeadInteraction {
  id: string
  lead_id: string
  interaction_type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'other'
  description?: string
  created_by: string
  created_at: string
  user?: User // Joined data
}

export interface LostReason {
  id: string
  reason: string
  category?: string
  is_active: boolean
  created_at: string
}