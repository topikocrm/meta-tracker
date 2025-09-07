'use client'

import { Users, BarChart, UserCheck, Clock } from 'lucide-react'

interface Lead {
  id: string
  full_name: string
  current_status: string
  assigned_to: string
  assigned_user?: {
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
}

interface LeadDashboardStatsProps {
  leads: Lead[]
  users: User[]
  onFilterChange?: (type: 'assignee' | 'status', value: string) => void
}

export default function LeadDashboardStats({ leads, users, onFilterChange }: LeadDashboardStatsProps) {
  // Calculate leads per agent/user (only those with assignments)
  const leadsPerAgent = users
    .map(user => {
      const assignedLeads = leads.filter(lead => lead.assigned_to === user.id)
      return {
        userId: user.id,
        userName: user.name,
        count: assignedLeads.length
      }
    })
    .filter(agent => agent.count > 0) // Only show agents with assignments

  // Add unassigned leads count
  const unassignedCount = leads.filter(lead => !lead.assigned_to).length
  if (unassignedCount > 0) {
    leadsPerAgent.push({
      userId: 'unassigned',
      userName: 'Unassigned',
      count: unassignedCount
    })
  }

  // Calculate status distribution
  const statusCounts = {
    new: leads.filter(l => l.current_status === 'new').length,
    contacted: leads.filter(l => l.current_status === 'contacted').length,
    interested: leads.filter(l => l.current_status === 'interested').length,
    demo: leads.filter(l => l.current_status === 'demo').length,
    negotiation: leads.filter(l => l.current_status === 'negotiation').length,
    won: leads.filter(l => l.current_status === 'won').length,
    lost: leads.filter(l => l.current_status === 'lost').length
  }

  const statusLabels = {
    new: 'New',
    contacted: 'Contacted', 
    interested: 'Interested',
    demo: 'Demo',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost'
  }

  const statusColors = {
    new: 'bg-blue-500',
    contacted: 'bg-yellow-500',
    interested: 'bg-green-500', 
    demo: 'bg-purple-500',
    negotiation: 'bg-orange-500',
    won: 'bg-emerald-500',
    lost: 'bg-red-500'
  }

  const handleAgentClick = (userId: string) => {
    if (onFilterChange) {
      onFilterChange('assignee', userId)
    }
  }

  const handleStatusClick = (status: string) => {
    if (onFilterChange) {
      onFilterChange('status', status)
    }
  }

  return (
    <div className="mb-6 space-y-6">
      {/* Leads Per Agent */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserCheck className="h-5 w-5 text-blue-600" />
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

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* All Status Option */}
          <div 
            className="bg-green-50 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors border-2 border-green-200"
            onClick={() => handleStatusClick('all')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-lg font-bold text-green-900">{leads.length}</span>
            </div>
            <div className="text-sm font-medium text-green-700">
              All Status
            </div>
            <div className="text-xs text-green-600">
              {leads.length === 1 ? 'lead total' : 'leads total'}
            </div>
          </div>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div 
              key={status} 
              className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleStatusClick(status)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`}></div>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
              <div className="text-sm font-medium text-gray-700">
                {statusLabels[status as keyof typeof statusLabels]}
              </div>
              <div className="text-xs text-gray-500">
                {count === 1 ? 'lead' : 'leads'}
              </div>
            </div>
          ))}
        </div>
        
        {/* Status Bar Visualization */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Clock className="h-4 w-4" />
            <span>Status Progress</span>
          </div>
          <div className="flex rounded-lg overflow-hidden h-3 bg-gray-200">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0
              if (count === 0) return null
              
              return (
                <div
                  key={status}
                  className={`${statusColors[status as keyof typeof statusColors]} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                  title={`${statusLabels[status as keyof typeof statusLabels]}: ${count} leads (${percentage.toFixed(1)}%)`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0</span>
            <span>{leads.length} total leads</span>
          </div>
        </div>
      </div>
    </div>
  )
}