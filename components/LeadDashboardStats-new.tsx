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

  // Helper function to generate tooltip text
  const getTooltipText = (agent: { stages: Record<string, number> }) => {
    const contacted = agent.stages['contacted'] || 0
    const qualified = agent.stages['qualified'] || 0
    const lost = agent.stages['lost'] || 0
    const won = agent.stages['won'] || 0
    const newLeads = agent.stages['new'] || 0
    
    return `New: ${newLeads}\nContacted: ${contacted}\nQualified: ${qualified}\nLost: ${lost}\nWon: ${won}`
  }

  const getAllAgentsTooltip = () => {
    const contacted = leads.filter(l => l.lead_stage === 'contacted').length
    const qualified = leads.filter(l => l.lead_stage === 'qualified').length
    const lost = leads.filter(l => l.lead_stage === 'lost').length
    const won = leads.filter(l => l.lead_stage === 'won').length
    const newLeads = leads.filter(l => !l.lead_stage || l.lead_stage === 'new').length
    
    return `New: ${newLeads}\nContacted: ${contacted}\nQualified: ${qualified}\nLost: ${lost}\nWon: ${won}`
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Leads per Agent - Compact View */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Leads per Agent</h3>
        </div>
        
        {/* Compact agent pills */}
        <div className="flex flex-wrap gap-2">
          {/* All Agents Option */}
          <button
            onClick={() => handleAgentClick('all')}
            title={getAllAgentsTooltip()}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedAgent === 'all' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Agents</span>
            <span className={`font-bold ${
              selectedAgent === 'all' ? 'text-white' : 'text-blue-900'
            }`}>{leads.length}</span>
          </button>
          
          {/* Individual agent pills */}
          {leadsPerAgent.map((agent) => (
            <button
              key={agent.userId}
              onClick={() => handleAgentClick(agent.userId)}
              title={getTooltipText(agent)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedAgent === agent.userId 
                  ? 'bg-gray-700 text-white shadow-md transform scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">{agent.userName}</span>
              <span className={`font-bold ${
                selectedAgent === agent.userId ? 'text-white' : 'text-gray-900'
              }`}>{agent.count}</span>
            </button>
          ))}
        </div>

        {/* Detailed breakdown for selected agent */}
        {selectedAgent !== 'all' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 font-medium mb-2">
              {leadsPerAgent.find(a => a.userId === selectedAgent)?.userName || 'Selected Agent'} - Breakdown
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {(() => {
                const agent = leadsPerAgent.find(a => a.userId === selectedAgent)
                if (!agent) return null
                
                return (
                  <>
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">{agent.stages['new'] || 0}</div>
                      <div className="text-gray-500">New</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">{agent.stages['contacted'] || 0}</div>
                      <div className="text-gray-500">Contacted</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-700">{agent.stages['qualified'] || 0}</div>
                      <div className="text-gray-500">Qualified</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-700">{agent.stages['lost'] || 0}</div>
                      <div className="text-gray-500">Lost</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-700">{agent.stages['won'] || 0}</div>
                      <div className="text-gray-500">Won</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
        
        {/* Show breakdown for "All Agents" when selected */}
        {selectedAgent === 'all' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 font-medium mb-2">All Agents - Breakdown</div>
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-gray-700">
                  {leads.filter(l => !l.lead_stage || l.lead_stage === 'new').length}
                </div>
                <div className="text-gray-500">New</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-700">
                  {leads.filter(l => l.lead_stage === 'contacted').length}
                </div>
                <div className="text-gray-500">Contacted</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-700">
                  {leads.filter(l => l.lead_stage === 'qualified').length}
                </div>
                <div className="text-gray-500">Qualified</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-700">
                  {leads.filter(l => l.lead_stage === 'lost').length}
                </div>
                <div className="text-gray-500">Lost</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-700">
                  {leads.filter(l => l.lead_stage === 'won').length}
                </div>
                <div className="text-gray-500">Won</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}