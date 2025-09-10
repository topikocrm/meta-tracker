/**
 * Shared utility functions for lead data handling
 * Ensures consistent counting and filtering across all dashboard pages
 */

export interface Lead {
  id: string
  full_name: string
  phone_number: string
  email?: string
  sheet_source?: string
  is_managed?: boolean
  lead_stage?: string
  lead_quality?: string
  current_status?: string
  created_time?: string
  created_at?: string
  assigned_to?: string
  assigned_user?: {
    id: string
    name: string
    email: string
  }
  [key: string]: any
}

/**
 * Get the creation date of a lead
 * Tries created_time first, falls back to created_at
 */
export function getLeadDate(lead: Lead): Date | null {
  const dateStr = lead.created_time || lead.created_at
  if (!dateStr) return null
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  
  return date
}

/**
 * Filter leads to only include managed leads
 * is_managed must be explicitly true (not null or false)
 */
export function filterManagedLeads(leads: Lead[]): Lead[] {
  return leads.filter(lead => lead.is_managed === true)
}

/**
 * Filter leads by date range
 */
export function filterByDateRange(
  leads: Lead[], 
  filter: 'all' | 'today' | 'last7days' | 'last30days'
): Lead[] {
  if (filter === 'all') return leads
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  today.setHours(0, 0, 0, 0)
  
  return leads.filter(lead => {
    const leadDate = getLeadDate(lead)
    if (!leadDate) {
      console.warn(`Lead ${lead.id} has no valid date field`, lead)
      return false
    }
    
    const leadDateStart = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate())
    leadDateStart.setHours(0, 0, 0, 0)
    
    switch (filter) {
      case 'today':
        return leadDateStart >= today
      
      case 'last7days':
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)
        return leadDateStart >= sevenDaysAgo
      
      case 'last30days':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        thirtyDaysAgo.setHours(0, 0, 0, 0)
        return leadDateStart >= thirtyDaysAgo
      
      default:
        return true
    }
  })
}

/**
 * Get lead counts by stage
 */
export function getLeadCountsByStage(leads: Lead[]) {
  return {
    total: leads.length,
    // Pipeline stages (using lead_stage field)
    new: leads.filter(l => !l.lead_stage || l.lead_stage === 'new').length,
    contacted: leads.filter(l => l.lead_stage === 'contacted').length,
    qualified: leads.filter(l => l.lead_stage === 'qualified').length,
    demo_scheduled: leads.filter(l => l.lead_stage === 'demo_scheduled').length,
    demo_completed: leads.filter(l => l.lead_stage === 'demo_completed').length,
    trial_started: leads.filter(l => l.lead_stage === 'trial_started').length,
    won: leads.filter(l => l.lead_stage === 'won').length,
    lost: leads.filter(l => l.lead_stage === 'lost').length,
    nurturing: leads.filter(l => l.lead_stage === 'nurturing').length,
    on_hold: leads.filter(l => l.lead_stage === 'on_hold').length
  }
}

/**
 * Get lead counts by quality
 */
export function getLeadCountsByQuality(leads: Lead[]) {
  return {
    hot: leads.filter(l => l.lead_quality === 'hot').length,
    warm: leads.filter(l => l.lead_quality === 'warm').length,
    cool: leads.filter(l => l.lead_quality === 'cool').length,
    cold: leads.filter(l => l.lead_quality === 'cold' || !l.lead_quality).length
  }
}

/**
 * Calculate comprehensive lead statistics
 * Used by main dashboard
 */
export function calculateLeadStats(
  leads: Lead[], 
  dateFilter: 'all' | 'today' | 'last7days' | 'last30days' = 'all'
) {
  // Step 1: Filter for managed leads only
  const managedLeads = filterManagedLeads(leads)
  
  // Step 2: Apply date filter
  const filteredLeads = filterByDateRange(managedLeads, dateFilter)
  
  // Step 3: Get counts
  const stageCounts = getLeadCountsByStage(filteredLeads)
  const qualityCounts = getLeadCountsByQuality(filteredLeads)
  
  // Combine demo stages for backward compatibility
  const demo = stageCounts.demo_scheduled + stageCounts.demo_completed
  
  return {
    total: filteredLeads.length,
    new: stageCounts.new,
    contacted: stageCounts.contacted,
    qualified: stageCounts.qualified,
    demo,
    trial: stageCounts.trial_started,
    won: stageCounts.won,
    lost: stageCounts.lost,
    ...qualityCounts,
    // Additional metadata
    managed: managedLeads.length,
    filtered: filteredLeads.length,
    dateFilter
  }
}

/**
 * Log lead data issues for debugging
 */
export function logLeadDataIssues(leads: Lead[], source: string) {
  const issues: string[] = []
  
  leads.forEach(lead => {
    if (lead.is_managed === undefined || lead.is_managed === null) {
      issues.push(`Lead ${lead.id} has undefined/null is_managed`)
    }
    if (!lead.created_time && !lead.created_at) {
      issues.push(`Lead ${lead.id} has no date field`)
    }
    if (!lead.sheet_source) {
      issues.push(`Lead ${lead.id} has no sheet_source`)
    }
  })
  
  if (issues.length > 0) {
    console.warn(`[${source}] Data issues found:`, issues)
  }
  
  // Log summary
  console.log(`[${source}] Lead data summary:`, {
    total: leads.length,
    managed_true: leads.filter(l => l.is_managed === true).length,
    managed_false: leads.filter(l => l.is_managed === false).length,
    managed_null: leads.filter(l => l.is_managed === null).length,
    managed_undefined: leads.filter(l => l.is_managed === undefined).length,
    has_created_time: leads.filter(l => l.created_time).length,
    has_created_at: leads.filter(l => l.created_at).length,
    has_no_date: leads.filter(l => !l.created_time && !l.created_at).length
  })
}