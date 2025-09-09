'use client'

import { Users, BarChart, Clock } from 'lucide-react'

interface Lead {
  id: string
  assigned_to: string
  current_status: string
  lead_stage?: string
  lead_quality?: string
  assigned_user?: {
    name: string
  }
}

interface LeadDashboardStatsProps {
  leads: Lead[]
  selectedAgent?: string
  onAgentClick?: (agentId: string) => void
  onStatusClick?: (status: string) => void
}

export default function LeadDashboardStats({ 
  leads = [], 
  selectedAgent = 'all',
  onAgentClick = () => {},
  onStatusClick = () => {}
}: LeadDashboardStatsProps) {
  
  // Calculate leads per agent with stage breakdown
  const leadsPerAgent = leads.reduce((acc, lead) => {
    const agentId = lead.assigned_to || 'unassigned'
    const agentName = lead.assigned_user?.name || 'Unassigned'
    const stage = lead.lead_stage || 'new'
    
    const existing = acc.find(a => a.userId === agentId)
    if (existing) {
      existing.count++
      existing.stages[stage] = (existing.stages[stage] || 0) + 1
    } else {
      acc.push({ 
        userId: agentId, 
        userName: agentName, 
        count: 1,
        stages: { [stage]: 1 }
      })
    }
    return acc
  }, [] as { userId: string; userName: string; count: number; stages: Record<string, number> }[])
  
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
            className={`rounded-lg p-4 cursor-pointer transition-colors border-2 ${
              selectedAgent === 'all' 
                ? 'bg-blue-100 border-blue-400 shadow-md' 
                : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
            }`}
            onClick={() => handleAgentClick('all')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  All Agents
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-blue-900">{leads.length}</span>
                <p className="text-xs text-blue-600">total</p>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Contacted</span>
                <span className="font-semibold text-blue-800">{leads.filter(l => l.lead_stage === 'contacted').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Qualified</span>
                <span className="font-semibold text-purple-700">{leads.filter(l => l.lead_stage === 'qualified').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Lost</span>
                <span className="font-semibold text-red-700">{leads.filter(l => l.lead_stage === 'lost').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Won</span>
                <span className="font-semibold text-green-700">{leads.filter(l => l.lead_stage === 'won').length}</span>
              </div>
            </div>
          </div>
          {leadsPerAgent.map((agent) => {
            const contactedCount = agent.stages['contacted'] || 0
            const qualifiedCount = agent.stages['qualified'] || 0
            const lostCount = agent.stages['lost'] || 0
            const wonCount = agent.stages['won'] || 0
            
            return (
              <div 
                key={agent.userId} 
                className={`rounded-lg p-4 cursor-pointer transition-colors border-2 ${
                  selectedAgent === agent.userId 
                    ? 'bg-gray-100 border-gray-400 shadow-md' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => handleAgentClick(agent.userId)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {agent.userName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">{agent.count}</span>
                    <p className="text-xs text-gray-500">total</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Contacted</span>
                    <span className="font-semibold text-blue-600">{contactedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Qualified</span>
                    <span className="font-semibold text-purple-600">{qualifiedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Lost</span>
                    <span className="font-semibold text-red-600">{lostCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Won</span>
                    <span className="font-semibold text-green-600">{wonCount}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pipeline Stage Distribution would go here if needed */}
      {/* Using the new lead_stage field instead of current_status */}
    </div>
  )
}