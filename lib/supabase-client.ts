import { createClient } from '@supabase/supabase-js'

export function createClientSupabase() {
  // Hardcoded values to bypass environment variable issues
  const supabaseUrl = 'https://nnituwulsjzoucbeuele.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uaXR1d3Vsc2p6b3VjYmV1ZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTc1NTYsImV4cCI6MjA3MjczMzU1Nn0.J1_ey_2GMdryzoRdHcH6Z79WtJExb4h-9CKSiXKcJtE'
  
  return createClient(supabaseUrl, supabaseAnonKey)
}