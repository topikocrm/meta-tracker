'use client'

import { Users, BarChart, Clock } from 'lucide-react'

interface Lead {
  id: string
  assigned_to: string
  current_status: string
  assigned_user?: {
    name: string
  }
}

interface LeadDashboardStatsProps {
  leads: Lead[]
  onAgentClick?: (agentId: string) => void
  onStatusClick?: (status: string) => void
}

export default function LeadDashboardStats({ 
  leads = [], 
  onAgentClick = () => {},
  onStatusClick = () => {}
}: LeadDashboardStatsProps) {
  
  // Calculate leads per agent
  const leadsPerAgent = leads.reduce((acc, lead) => {
    const agentId = lead.assigned_to || 'unassigned'
    const agentName = lead.assigned_user?.name || 'Unassigned'
    
    const existing = acc.find(a => a.userId === agentId)
    if (existing) {
      existing.count++
    } else {
      acc.push({ userId: agentId, userName: agentName, count: 1 })
    }
    return acc
  }, [] as { userId: string; userName: string; count: number }[])
  
  // Sort by count descending
  leadsPerAgent.sort((a, b) => b.count - a.count)
  
  const handleAgentClick = (agentId: string) => {
    if (onAgentClick) {
      onAgentClick(agentId)
    }
  }

  const handleStatusClick = (status: string) => {
    if (onStatusClick) {
      onStatusClick(status)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Leads per Agent */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Leads per Agent</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* All Agents Option */}
          <div 
            className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors border-2 border-blue-200"
            onClick={() => handleAgentClick('all')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  All Agents
                </span>
              </div>
              <span className="text-lg font-bold text-blue-900">
                {leads.length}
              </span>
            </div>
            <div className="mt-1">
              <div className="text-xs text-blue-600">
                {leads.length === 1 ? 'lead total' : 'leads total'}
              </div>
            </div>
          </div>
          {leadsPerAgent.map((agent) => (
            <div 
              key={agent.userId} 
              className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleAgentClick(agent.userId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {agent.userName}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {agent.count}
                </span>
              </div>
              <div className="mt-1">
                <div className="text-xs text-gray-500">
                  {agent.count === 1 ? 'lead' : 'leads'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Stage Distribution would go here if needed */}
      {/* Using the new lead_stage field instead of current_status */}
    </div>
  )
}