'use client'

import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
  onAgentClick?: (agentId: string) => void
  onStatusClick?: (status: string) => void
}

export default function LeadDashboardStatsTable({ 
  leads = [], 
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
  
  // Calculate totals for "All Agents" row
  const totals = {
    total: leads.length,
    new: leads.filter(l => !l.lead_stage || l.lead_stage === 'new').length,
    contacted: leads.filter(l => l.lead_stage === 'contacted').length,
    qualified: leads.filter(l => l.lead_stage === 'qualified').length,
    demo: leads.filter(l => l.lead_stage === 'demo_scheduled' || l.lead_stage === 'demo_completed').length,
    trial: leads.filter(l => l.lead_stage === 'trial_started').length,
    won: leads.filter(l => l.lead_stage === 'won').length,
    lost: leads.filter(l => l.lead_stage === 'lost').length,
  }

  const handleAgentClick = (agentId: string) => {
    if (onAgentClick) {
      onAgentClick(agentId)
    }
  }

  // Calculate win rate for visual indicator
  const getWinRate = (won: number, total: number) => {
    if (total === 0) return 0
    return Math.round((won / total) * 100)
  }

  // Get trend icon based on performance
  const getTrendIcon = (winRate: number) => {
    if (winRate > 30) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (winRate < 10) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Agent Performance</h3>
          <span className="text-sm text-gray-500">({leadsPerAgent.length} agents)</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                New
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacted
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qualified
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Demo
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trial
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Won
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lost
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* All Agents Summary Row */}
            <tr 
              className="bg-blue-50 hover:bg-blue-100 cursor-pointer font-semibold"
              onClick={() => handleAgentClick('all')}
            >
              <td className="px-6 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">All Agents</span>
                </div>
              </td>
              <td className="px-3 py-3 text-center text-sm font-bold text-gray-900">{totals.total}</td>
              <td className="px-3 py-3 text-center text-sm text-gray-600">{totals.new}</td>
              <td className="px-3 py-3 text-center text-sm text-blue-600">{totals.contacted}</td>
              <td className="px-3 py-3 text-center text-sm text-purple-600">{totals.qualified}</td>
              <td className="px-3 py-3 text-center text-sm text-pink-600">{totals.demo}</td>
              <td className="px-3 py-3 text-center text-sm text-orange-600">{totals.trial}</td>
              <td className="px-3 py-3 text-center text-sm text-green-600 font-semibold">{totals.won}</td>
              <td className="px-3 py-3 text-center text-sm text-red-600">{totals.lost}</td>
              <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {getWinRate(totals.won, totals.total)}%
                  </span>
                  {getTrendIcon(getWinRate(totals.won, totals.total))}
                </div>
              </td>
            </tr>
            
            {/* Individual Agent Rows */}
            {leadsPerAgent.map((agent) => {
              const newCount = agent.stages['new'] || 0
              const contactedCount = agent.stages['contacted'] || 0
              const qualifiedCount = agent.stages['qualified'] || 0
              const demoCount = (agent.stages['demo_scheduled'] || 0) + (agent.stages['demo_completed'] || 0)
              const trialCount = agent.stages['trial_started'] || 0
              const wonCount = agent.stages['won'] || 0
              const lostCount = agent.stages['lost'] || 0
              const winRate = getWinRate(wonCount, agent.count)
              
              return (
                <tr 
                  key={agent.userId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAgentClick(agent.userId)}
                >
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {agent.userName}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-semibold text-gray-900">{agent.count}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600">{newCount || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm text-blue-600">{contactedCount || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm text-purple-600">{qualifiedCount || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm text-pink-600">{demoCount || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm text-orange-600">{trialCount || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm text-green-600 font-semibold">{wonCount || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm text-red-600">{lostCount || '-'}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm text-gray-600">{winRate}%</span>
                      {getTrendIcon(winRate)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary Stats */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Average leads per agent: {Math.round(leads.length / (leadsPerAgent.length || 1))}</span>
          <span>Overall win rate: {getWinRate(totals.won, totals.total)}%</span>
        </div>
      </div>
    </div>
  )
}