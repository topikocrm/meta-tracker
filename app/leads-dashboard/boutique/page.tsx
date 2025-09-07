'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Phone, MessageSquare, Search, Filter, Download, UserPlus, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import LeadQualityBadge from '@/components/LeadQualityBadge'
import PipelineStageTracker from '@/components/PipelineStageTracker'
import EnhancedLeadModal from '@/components/EnhancedLeadModal'
import LeadDashboardStats from '@/components/LeadDashboardStats'

interface Lead {
  id: string
  full_name: string
  phone_number: string
  email: string
  state: string
  current_status: any
  assigned_to: string
  created_time: string
  sheet_source: string
  is_managed: boolean
  assigned_user?: {
    name: string
    email: string
  }
  additional_data?: any
  _isNew?: boolean
  _rowNumber?: number
}

export default function BoutiqueLeadsPage() {
  const router = useRouter()
  const [managedLeads, setManagedLeads] = useState<Lead[]>([])
  const [newLeads, setNewLeads] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [users, setUsers] = useState<any[]>([])
  const [sortField, setSortField] = useState<'created_time' | 'full_name' | 'current_status' | 'assigned_to' | 'lead_quality' | 'lead_stage'>('created_time')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchLeads()
    fetchUsers()
    checkNewLeads()
  }, [])

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      // Try simple endpoint first
      let response = await fetch('/api/leads/simple?source=sheet_2_boutique&limit=1000')
      let data = await response.json()
      
      // Fallback to regular endpoint if simple fails
      if (!data.success) {
        response = await fetch('/api/leads?source=sheet_2_boutique&limit=1000')
        data = await response.json()
      }
      
      if (data.success) {
        // Filter for managed leads only
        const managed = (data.leads || []).filter((l: any) => l.is_managed !== false)
        setManagedLeads(managed)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    }
    setIsLoading(false)
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const checkNewLeads = async () => {
    try {
      const response = await fetch('/api/leads/check-new')
      const data = await response.json()
      
      if (data.success) {
        const boutiqueSheet = data.sheets?.find((s: any) => s.source === 'sheet_2_boutique')
        if (boutiqueSheet) {
          setNewLeads(boutiqueSheet.leads || [])
        }
      }
    } catch (error) {
      console.error('Failed to check new leads:', error)
    }
  }

  const handleQuickImport = async (lead: any) => {
    try {
      const response = await fetch('/api/leads/quick-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          initialStatus: 'new'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // Remove from new leads and add to managed
        setNewLeads(newLeads.filter(l => l._rowNumber !== lead._rowNumber))
        setManagedLeads([data.lead, ...managedLeads])
      }
    } catch (error) {
      console.error('Failed to import lead:', error)
    }
  }

  const filteredLeads = managedLeads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone_number?.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.current_status === statusFilter
    const matchesAssignee = assigneeFilter === 'all' || 
      (assigneeFilter === 'unassigned' && !lead.assigned_to) ||
      lead.assigned_to === assigneeFilter
    
    return matchesSearch && matchesStatus && matchesAssignee
  }).sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]
    
    // Handle special cases
    if (sortField === 'assigned_to') {
      aValue = a.assigned_user?.name || 'zzz' // Unassigned at the end
      bValue = b.assigned_user?.name || 'zzz'
    }
    
    // Handle null/undefined values
    if (!aValue) aValue = ''
    if (!bValue) bValue = ''
    
    // Compare values
    let comparison = 0
    if (aValue < bValue) comparison = -1
    if (aValue > bValue) comparison = 1
    
    // Apply sort direction
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/leads-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Boutique Leads</h1>
                <p className="text-sm text-gray-600">Fashion & Boutique Business Leads</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  fetchLeads()
                  checkNewLeads()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* New Leads Alert */}
        {newLeads.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900">
                  {newLeads.length} New {newLeads.length === 1 ? 'Lead' : 'Leads'} Available
                </h3>
                <div className="mt-3 space-y-2">
                  {newLeads.slice(0, 3).map((lead, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{lead.full_name || 'No Name'}</p>
                          <p className="text-sm text-gray-600">{lead.phone_number || 'No Phone'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleQuickImport(lead)}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                      >
                        <UserPlus className="h-4 w-4" />
                        Import & Manage
                      </button>
                    </div>
                  ))}
                  {newLeads.length > 3 && (
                    <p className="text-sm text-yellow-700 text-center">
                      And {newLeads.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Statistics */}
        <LeadDashboardStats 
          leads={managedLeads} 
          users={users} 
          onFilterChange={(type, value) => {
            if (type === 'assignee') {
              setAssigneeFilter(value)
            } else if (type === 'status') {
              setStatusFilter(value)
            }
          }}
        />

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="demo">Demo</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredLeads.length} of {managedLeads.length} leads</span>
            <span>{newLeads.length > 0 && `${newLeads.length} new leads pending import`}</span>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('full_name')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Lead Info
                      {sortField === 'full_name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('lead_quality')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Quality
                      {sortField === 'lead_quality' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('lead_stage')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Pipeline Stage
                      {sortField === 'lead_stage' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('assigned_to')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Assigned To
                      {sortField === 'assigned_to' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('created_time')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Created
                      {sortField === 'created_time' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedLead(lead)
                      setShowModal(true)
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.full_name || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.state || 'No Location'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{lead.phone_number || '-'}</div>
                        <div className="text-sm text-gray-500">{lead.email || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <LeadQualityBadge quality={lead.lead_quality || 'cold'} size="sm" showLabel={true} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PipelineStageTracker 
                        currentStage={lead.lead_stage || 'new'} 
                        variant="compact" 
                        showProgress={false}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.assigned_user?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.created_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (lead.phone_number) {
                              window.open(`tel:${lead.phone_number}`, '_blank')
                            }
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (lead.phone_number) {
                              const phone = lead.phone_number.replace(/[^\d]/g, '')
                              window.open(`https://wa.me/${phone}`, '_blank')
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredLeads.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No leads found matching your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Lead Modal with Full CRM Features */}
      {showModal && selectedLead && (
        <EnhancedLeadModal
          lead={selectedLead}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedLead(null)
            fetchLeads() // Refresh after modal close
          }}
        />
      )}
    </div>
  )
}