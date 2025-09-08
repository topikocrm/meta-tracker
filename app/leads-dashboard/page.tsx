'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ShoppingBag, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, RefreshCw, Loader, Calendar } from 'lucide-react'

interface DashboardStats {
  food: {
    total: number
    // Pipeline stages
    new: number
    contacted: number
    qualified: number
    demo: number
    trial: number
    won: number
    lost: number
    // Lead quality
    hot: number
    warm: number
    cool: number
    cold: number
    // Legacy field for compatibility
    interested?: number
  }
  boutique: {
    total: number
    // Pipeline stages
    new: number
    contacted: number
    qualified: number
    demo: number
    trial: number
    won: number
    lost: number
    // Lead quality
    hot: number
    warm: number
    cool: number
    cold: number
    // Legacy field for compatibility
    interested?: number
  }
}

type DateFilter = 'today' | 'last7days' | 'last30days' | 'all'

export default function LeadsDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    food: { total: 0, new: 0, contacted: 0, qualified: 0, demo: 0, trial: 0, won: 0, lost: 0, hot: 0, warm: 0, cool: 0, cold: 0 },
    boutique: { total: 0, new: 0, contacted: 0, qualified: 0, demo: 0, trial: 0, won: 0, lost: 0, hot: 0, warm: 0, cool: 0, cold: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [newLeadsCount, setNewLeadsCount] = useState({ food: 0, boutique: 0 })
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  useEffect(() => {
    fetchDashboardData()
    checkNewLeads()
  }, [dateFilter])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Try the simple endpoint first for better reliability
      let response = await fetch('/api/leads/simple?limit=1000')
      let data = await response.json()
      
      // If simple endpoint fails, try the regular one
      if (!data.success) {
        response = await fetch('/api/leads?limit=1000')
        data = await response.json()
      }
      
      if (data.success) {
        const leads = data.leads || []
        
        // Calculate stats for each source
        const foodLeads = leads.filter((l: any) => l.sheet_source === 'sheet_1_food')
        const boutiqueLeads = leads.filter((l: any) => l.sheet_source === 'sheet_2_boutique')
        
        const foodStats = calculateStats(foodLeads)
        const boutiqueStats = calculateStats(boutiqueLeads)
        
        setStats({
          food: foodStats,
          boutique: boutiqueStats
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
    setIsLoading(false)
    setLastRefresh(new Date())
  }

  const checkNewLeads = async () => {
    try {
      const response = await fetch('/api/leads/check-new')
      const data = await response.json()
      
      if (data.success) {
        const foodSheet = data.sheets?.find((s: any) => s.source === 'sheet_1_food')
        const boutiqueSheet = data.sheets?.find((s: any) => s.source === 'sheet_2_boutique')
        
        setNewLeadsCount({
          food: foodSheet?.newCount || 0,
          boutique: boutiqueSheet?.newCount || 0
        })
      }
    } catch (error) {
      console.error('Failed to check new leads:', error)
    }
  }

  const filterLeadsByDate = (leads: any[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateFilter) {
      case 'today':
        return leads.filter(lead => {
          const leadDate = new Date(lead.created_at || lead.created_time)
          return leadDate >= today
        })
      case 'last7days':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return leads.filter(lead => {
          const leadDate = new Date(lead.created_at || lead.created_time)
          return leadDate >= sevenDaysAgo
        })
      case 'last30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return leads.filter(lead => {
          const leadDate = new Date(lead.created_at || lead.created_time)
          return leadDate >= thirtyDaysAgo
        })
      case 'all':
      default:
        return leads
    }
  }

  const calculateStats = (leads: any[]) => {
    // All leads with is_managed=true are considered managed, regardless of status
    const managedLeads = leads.filter(l => l.is_managed !== false)
    const filteredLeads = filterLeadsByDate(managedLeads)
    return {
      total: filteredLeads.length,
      // Pipeline stages
      new: filteredLeads.filter(l => !l.lead_stage || l.lead_stage === 'new').length,
      contacted: filteredLeads.filter(l => l.lead_stage === 'contacted').length,
      qualified: filteredLeads.filter(l => l.lead_stage === 'qualified').length,
      demo: filteredLeads.filter(l => l.lead_stage === 'demo_scheduled' || l.lead_stage === 'demo_completed').length,
      trial: filteredLeads.filter(l => l.lead_stage === 'trial_started').length,
      won: filteredLeads.filter(l => l.lead_stage === 'won').length,
      lost: filteredLeads.filter(l => l.lead_stage === 'lost').length,
      // Lead quality
      hot: filteredLeads.filter(l => l.lead_quality === 'hot').length,
      warm: filteredLeads.filter(l => l.lead_quality === 'warm').length,
      cool: filteredLeads.filter(l => l.lead_quality === 'cool').length,
      cold: filteredLeads.filter(l => l.lead_quality === 'cold').length
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
    checkNewLeads()
  }

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
      <p className="text-xs text-gray-600 truncate">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your Food and Boutique leads with CRM features</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Date Filter */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'today' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('last7days')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'last7days' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateFilter('last30days')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'last30days' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'all' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Time
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* New Leads Alert */}
        {(newLeadsCount.food > 0 || newLeadsCount.boutique > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">New Leads Available!</p>
                <p className="text-sm text-yellow-700">
                  {newLeadsCount.food > 0 && `${newLeadsCount.food} new Food leads`}
                  {newLeadsCount.food > 0 && newLeadsCount.boutique > 0 && ', '}
                  {newLeadsCount.boutique > 0 && `${newLeadsCount.boutique} new Boutique leads`}
                  {' '}ready to be imported
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Food Leads Card */}
            <div 
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-xl"
              onClick={() => router.push('/leads-dashboard/food')}
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                      <ShoppingBag className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Food Leads</h2>
                      <p className="text-orange-100">Restaurant & Food Business</p>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-white/70" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.food.total}</p>
                    <p className="text-sm text-gray-600">
                      {dateFilter === 'all' ? 'Total' : (
                        dateFilter === 'today' ? "Today's" : 
                        dateFilter === 'last7days' ? 'Last 7 Days' : 
                        'Last 30 Days'
                      )} Leads
                    </p>
                  </div>
                  {newLeadsCount.food > 0 && (
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      +{newLeadsCount.food} New
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Pipeline Stages */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pipeline Stages</p>
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label="🆕 New" value={stats.food.new} color="text-blue-600" />
                      <StatCard label="📞 Contacted" value={stats.food.contacted} color="text-indigo-600" />
                      <StatCard label="✅ Qualified" value={stats.food.qualified} color="text-purple-600" />
                      <StatCard label="🎯 Demo" value={stats.food.demo} color="text-pink-600" />
                      <StatCard label="🚀 Trial" value={stats.food.trial} color="text-orange-600" />
                      <StatCard label="🏆 Won" value={stats.food.won} color="text-emerald-600" />
                    </div>
                  </div>
                  {/* Lead Quality */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Lead Quality</p>
                    <div className="grid grid-cols-4 gap-2">
                      <StatCard label="🔥 Hot" value={stats.food.hot} color="text-red-600" />
                      <StatCard label="☀️ Warm" value={stats.food.warm} color="text-orange-500" />
                      <StatCard label="❄️ Cool" value={stats.food.cool} color="text-blue-500" />
                      <StatCard label="🧊 Cold" value={stats.food.cold} color="text-gray-500" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-medium text-gray-900">
                      {stats.food.total > 0 
                        ? `${Math.round((stats.food.won / stats.food.total) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutique Leads Card */}
            <div 
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-xl"
              onClick={() => router.push('/leads-dashboard/boutique')}
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Boutique Leads</h2>
                      <p className="text-purple-100">Fashion & Boutique Business</p>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-white/70" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.boutique.total}</p>
                    <p className="text-sm text-gray-600">
                      {dateFilter === 'all' ? 'Total' : (
                        dateFilter === 'today' ? "Today's" : 
                        dateFilter === 'last7days' ? 'Last 7 Days' : 
                        'Last 30 Days'
                      )} Leads
                    </p>
                  </div>
                  {newLeadsCount.boutique > 0 && (
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      +{newLeadsCount.boutique} New
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Pipeline Stages */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pipeline Stages</p>
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label="🆕 New" value={stats.boutique.new} color="text-blue-600" />
                      <StatCard label="📞 Contacted" value={stats.boutique.contacted} color="text-indigo-600" />
                      <StatCard label="✅ Qualified" value={stats.boutique.qualified} color="text-purple-600" />
                      <StatCard label="🎯 Demo" value={stats.boutique.demo} color="text-pink-600" />
                      <StatCard label="🚀 Trial" value={stats.boutique.trial} color="text-orange-600" />
                      <StatCard label="🏆 Won" value={stats.boutique.won} color="text-emerald-600" />
                    </div>
                  </div>
                  {/* Lead Quality */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Lead Quality</p>
                    <div className="grid grid-cols-4 gap-2">
                      <StatCard label="🔥 Hot" value={stats.boutique.hot} color="text-red-600" />
                      <StatCard label="☀️ Warm" value={stats.boutique.warm} color="text-orange-500" />
                      <StatCard label="❄️ Cool" value={stats.boutique.cool} color="text-blue-500" />
                      <StatCard label="🧊 Cold" value={stats.boutique.cold} color="text-gray-500" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-medium text-gray-900">
                      {stats.boutique.total > 0 
                        ? `${Math.round((stats.boutique.won / stats.boutique.total) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/test-supabase')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <h4 className="font-medium text-gray-900">Sync Settings</h4>
              <p className="text-sm text-gray-600 mt-1">Manage data sync and import settings</p>
            </button>
            <button
              onClick={() => router.push('/test-sheets')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <h4 className="font-medium text-gray-900">Raw Sheets View</h4>
              <p className="text-sm text-gray-600 mt-1">View original Google Sheets data</p>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <h4 className="font-medium text-gray-900">Refresh All</h4>
              <p className="text-sm text-gray-600 mt-1">Reload dashboard and check for new leads</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}