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
  
  // Calculate leads per agent with stage and quality breakdown
  const leadsPerAgent = leads.reduce((acc, lead) => {
    const agentId = lead.assigned_to || 'unassigned'
    const agentName = lead.assigned_user?.name || 'Unassigned'
    const stage = lead.lead_stage || 'new'
    const quality = lead.lead_quality || 'cold'
    
    const existing = acc.find(a => a.userId === agentId)
    if (existing) {
      existing.count++
      existing.stages[stage] = (existing.stages[stage] || 0) + 1
      existing.quality[quality] = (existing.quality[quality] || 0) + 1
    } else {
      acc.push({ 
        userId: agentId, 
        userName: agentName, 
        count: 1,
        stages: { [stage]: 1 },
        quality: { [quality]: 1 }
      })
    }
    return acc
  }, [] as { userId: string; userName: string; count: number; stages: Record<string, number>; quality: Record<string, number> }[])
  
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
  const getTooltipText = (agent: { stages: Record<string, number>; quality: Record<string, number> }) => {
    const contacted = agent.stages['contacted'] || 0
    const qualified = agent.stages['qualified'] || 0
    const lost = agent.stages['lost'] || 0
    const won = agent.stages['won'] || 0
    const newLeads = agent.stages['new'] || 0
    
    const hot = agent.quality['hot'] || 0
    const warm = agent.quality['warm'] || 0
    const cool = agent.quality['cool'] || 0
    const cold = agent.quality['cold'] || 0
    
    return `Stages:\nNew: ${newLeads}\nContacted: ${contacted}\nQualified: ${qualified}\nLost: ${lost}\nWon: ${won}\n\nQuality:\nHot: ${hot}\nWarm: ${warm}\nCool: ${cool}\nCold: ${cold}`
  }
  
  // Helper function to get quality color dots
  const getQualityDots = (quality: Record<string, number>) => {
    const hot = quality['hot'] || 0
    const warm = quality['warm'] || 0
    const cool = quality['cool'] || 0
    const cold = quality['cold'] || 0
    
    return (
      <div className="flex items-center gap-0.5">
        {hot > 0 && (
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" title={`${hot} hot`} />
            {hot > 1 && <span className="text-[10px] ml-0.5 text-red-600">{hot}</span>}
          </div>
        )}
        {warm > 0 && (
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title={`${warm} warm`} />
            {warm > 1 && <span className="text-[10px] ml-0.5 text-orange-600">{warm}</span>}
          </div>
        )}
        {cool > 0 && (
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title={`${cool} cool`} />
            {cool > 1 && <span className="text-[10px] ml-0.5 text-blue-600">{cool}</span>}
          </div>
        )}
        {cold > 0 && (
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" title={`${cold} cold`} />
            {cold > 1 && <span className="text-[10px] ml-0.5 text-gray-600">{cold}</span>}
          </div>
        )}
      </div>
    )
  }

  const getAllAgentsTooltip = () => {
    const contacted = leads.filter(l => l.lead_stage === 'contacted').length
    const qualified = leads.filter(l => l.lead_stage === 'qualified').length
    const lost = leads.filter(l => l.lead_stage === 'lost').length
    const won = leads.filter(l => l.lead_stage === 'won').length
    const newLeads = leads.filter(l => !l.lead_stage || l.lead_stage === 'new').length
    
    const hot = leads.filter(l => l.lead_quality === 'hot').length
    const warm = leads.filter(l => l.lead_quality === 'warm').length
    const cool = leads.filter(l => l.lead_quality === 'cool').length
    const cold = leads.filter(l => l.lead_quality === 'cold' || !l.lead_quality).length
    
    return `Stages:\nNew: ${newLeads}\nContacted: ${contacted}\nQualified: ${qualified}\nLost: ${lost}\nWon: ${won}\n\nQuality:\nHot: ${hot}\nWarm: ${warm}\nCool: ${cool}\nCold: ${cold}`
  }
  
  const getAllAgentsQuality = () => {
    const quality: Record<string, number> = {
      hot: leads.filter(l => l.lead_quality === 'hot').length,
      warm: leads.filter(l => l.lead_quality === 'warm').length,
      cool: leads.filter(l => l.lead_quality === 'cool').length,
      cold: leads.filter(l => l.lead_quality === 'cold' || !l.lead_quality).length
    }
    return quality
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
            {/* Stage Breakdown */}
            <div className="grid grid-cols-5 gap-2 text-xs mb-3">
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
            {/* Quality Breakdown */}
            <div className="border-t pt-2">
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(() => {
                  const agent = leadsPerAgent.find(a => a.userId === selectedAgent)
                  if (!agent) return null
                  
                  return (
                    <>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">{agent.quality['hot'] || 0}</div>
                        <div className="text-gray-500">Hot</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">{agent.quality['warm'] || 0}</div>
                        <div className="text-gray-500">Warm</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{agent.quality['cool'] || 0}</div>
                        <div className="text-gray-500">Cool</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-600">{agent.quality['cold'] || 0}</div>
                        <div className="text-gray-500">Cold</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
        
        {/* Show breakdown for "All Agents" when selected */}
        {selectedAgent === 'all' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 font-medium mb-2">All Agents - Breakdown</div>
            {/* Stage Breakdown */}
            <div className="grid grid-cols-5 gap-2 text-xs mb-3">
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
            {/* Quality Breakdown */}
            <div className="border-t pt-2">
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-red-600">
                    {leads.filter(l => l.lead_quality === 'hot').length}
                  </div>
                  <div className="text-gray-500">Hot</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">
                    {leads.filter(l => l.lead_quality === 'warm').length}
                  </div>
                  <div className="text-gray-500">Warm</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">
                    {leads.filter(l => l.lead_quality === 'cool').length}
                  </div>
                  <div className="text-gray-500">Cool</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-600">
                    {leads.filter(l => l.lead_quality === 'cold' || !l.lead_quality).length}
                  </div>
                  <div className="text-gray-500">Cold</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}