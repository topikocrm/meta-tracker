import { Lead, User, LeadStatus } from '@/types/database'

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    phone: '9876543210',
    role: 'admin',
    location: 'Delhi',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'john@example.com',
    name: 'John Sales',
    phone: '9876543211',
    role: 'user',
    location: 'Mumbai',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'sarah@example.com',
    name: 'Sarah Manager',
    phone: '9876543212',
    role: 'manager',
    location: 'Bangalore',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Generate mock leads
export function generateMockLeads(count: number = 50): Lead[] {
  const statuses: LeadStatus[] = ['new', 'contacted', 'interested', 'demo', 'negotiation', 'won', 'lost']
  const campaigns = ['Summer Sale 2024', 'Diwali Offer', 'New Year Campaign', 'Flash Sale March']
  const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Telangana', 'Kerala']
  const firstNames = ['Raj', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Neha', 'Rohit', 'Divya']
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Verma', 'Joshi', 'Rao']
  
  const leads: Lead[] = []
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const campaign = campaigns[Math.floor(Math.random() * campaigns.length)]
    const state = states[Math.floor(Math.random() * states.length)]
    const assignedUser = Math.random() > 0.3 ? mockUsers[Math.floor(Math.random() * mockUsers.length)] : undefined
    
    // Random date in last 30 days
    const daysAgo = Math.floor(Math.random() * 30)
    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - daysAgo)
    
    leads.push({
      id: `lead-${i + 1}`,
      google_sheet_id: `GS${1000 + i}`,
      created_time: createdDate.toISOString(),
      full_name: `${firstName} ${lastName}`,
      phone_number: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      whatsapp_number: `91${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      state: state,
      city: `${state} City`,
      campaign_id: `camp_${Math.floor(Math.random() * 1000)}`,
      campaign_name: campaign,
      adset_id: `adset_${Math.floor(Math.random() * 1000)}`,
      adset_name: `${campaign} - Adset ${Math.floor(Math.random() * 10)}`,
      ad_id: `ad_${Math.floor(Math.random() * 1000)}`,
      ad_name: `${campaign} - Creative ${Math.floor(Math.random() * 10)}`,
      form_id: `form_${Math.floor(Math.random() * 100)}`,
      form_name: 'Lead Generation Form',
      platform: 'Facebook',
      is_organic: Math.random() > 0.8,
      tool_requirement: Math.random() > 0.5 ? 'Looking for payment gateway and delivery system' : '',
      assigned_to: assignedUser?.id,
      assigned_user: assignedUser,
      current_status: status,
      conversion_value: status === 'won' ? Math.floor(Math.random() * 50000) + 5000 : undefined,
      sheet_source: 'Primary Campaign',
      created_at: createdDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
  
  return leads
}

// Mock stats for dashboard
export function getMockStats(leads: Lead[]) {
  return {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.current_status === 'new').length,
    wonLeads: leads.filter(l => l.current_status === 'won').length,
    lostLeads: leads.filter(l => l.current_status === 'lost').length,
    activeLeads: leads.filter(l => !['won', 'lost'].includes(l.current_status)).length,
    conversionRate: ((leads.filter(l => l.current_status === 'won').length / leads.length) * 100).toFixed(1),
    totalRevenue: leads
      .filter(l => l.current_status === 'won')
      .reduce((sum, l) => sum + (l.conversion_value || 0), 0),
    campaignPerformance: getCampaignStats(leads),
  }
}

function getCampaignStats(leads: Lead[]) {
  const campaigns = new Map<string, { total: number; won: number; revenue: number }>()
  
  leads.forEach(lead => {
    if (lead.campaign_name) {
      const existing = campaigns.get(lead.campaign_name) || { total: 0, won: 0, revenue: 0 }
      existing.total++
      if (lead.current_status === 'won') {
        existing.won++
        existing.revenue += lead.conversion_value || 0
      }
      campaigns.set(lead.campaign_name, existing)
    }
  })
  
  return Array.from(campaigns.entries()).map(([name, stats]) => ({
    campaign: name,
    leads: stats.total,
    conversions: stats.won,
    conversionRate: ((stats.won / stats.total) * 100).toFixed(1),
    revenue: stats.revenue,
  }))
}