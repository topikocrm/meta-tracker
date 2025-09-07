'use client'

import { useState, useEffect } from 'react'
import { Lead, LeadStatus } from '@/types/database'
import LeadTable from '@/components/LeadTable'
import LeadFilters from '@/components/LeadFilters'
import DashboardStats from '@/components/DashboardStats'
import { generateMockLeads } from '@/lib/mock-data'
import { RefreshCw } from 'lucide-react'

export default function DemoPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Generate mock data on mount
    setTimeout(() => {
      const mockLeads = generateMockLeads(50)
      setLeads(mockLeads)
      setIsLoading(false)
    }, 500) // Simulate loading
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, statusFilter, campaignFilter])

  const filterLeads = () => {
    let filtered = [...leads]

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone_number?.includes(searchTerm) ||
        lead.whatsapp_number?.includes(searchTerm) ||
        lead.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.current_status === statusFilter)
    }

    if (campaignFilter !== 'all') {
      filtered = filtered.filter(lead => lead.campaign_name === campaignFilter)
    }

    setFilteredLeads(filtered)
  }

  const handleStatusUpdate = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, current_status: newStatus, conversion_value: newStatus === 'won' ? 25000 : lead.conversion_value }
          : lead
      )
    )
  }

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      const newMockLeads = generateMockLeads(50)
      setLeads(newMockLeads)
      setIsLoading(false)
    }, 500)
  }

  const campaigns = Array.from(new Set(leads.map(l => l.campaign_name).filter(Boolean))) as string[]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-lg text-gray-600">Loading demo data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              🎭 <strong>Demo Mode:</strong> This is a preview with mock data. No database connection required.
            </p>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-900"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Tracker Dashboard</h1>
          <p className="mt-2 text-gray-600">Demo version - Explore all features with sample data</p>
        </div>

        <DashboardStats leads={leads} />

        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <LeadFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              campaignFilter={campaignFilter}
              onCampaignChange={setCampaignFilter}
              campaigns={campaigns}
            />
          </div>

          <LeadTable
            leads={filteredLeads}
            onStatusUpdate={handleStatusUpdate}
            isDemo={true}
          />
        </div>

        {/* Feature Showcase */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Try These Features</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Change lead status in dropdown</li>
              <li>• Click WhatsApp icon to chat</li>
              <li>• Search by name or phone</li>
              <li>• Filter by status or campaign</li>
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">Real Features</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Auto-sync every 5 minutes</li>
              <li>• Real-time team updates</li>
              <li>• Lead assignment system</li>
              <li>• Analytics & reporting</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">Setup Required</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Supabase (free tier)</li>
              <li>• Google Sheets (public)</li>
              <li>• Vercel deployment</li>
              <li>• Total setup: 15 minutes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}