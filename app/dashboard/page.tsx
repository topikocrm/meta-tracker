'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStatus } from '@/types/database'
import { useRouter } from 'next/navigation'
import LeadTable from '@/components/LeadTable'
import LeadFilters from '@/components/LeadFilters'
import DashboardStats from '@/components/DashboardStats'

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchLeads()
    subscribeToLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, statusFilter, campaignFilter])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    }
  }

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_user:users!assigned_to(id, name, email),
          lost_reason:lost_reasons(id, reason)
        `)
        .order('created_time', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToLeads = () => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

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

  const handleStatusUpdate = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ current_status: newStatus })
        .eq('id', leadId)

      if (error) throw error

      // Also log status change
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('lead_status_history')
          .insert({
            lead_id: leadId,
            new_status: newStatus,
            changed_by: user.id
          })
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
    }
  }

  const campaigns = Array.from(new Set(leads.map(l => l.campaign_name).filter(Boolean))) as string[]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Tracker Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage and track all your Meta advertising leads</p>
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
          />
        </div>
      </div>
    </div>
  )
}