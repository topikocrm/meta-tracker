'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ShoppingBag, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, RefreshCw, Loader } from 'lucide-react'

interface DashboardStats {
  food: {
    total: number
    new: number
    contacted: number
    interested: number
    won: number
    lost: number
  }
  boutique: {
    total: number
    new: number
    contacted: number
    interested: number
    won: number
    lost: number
  }
}

export default function LeadsDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    food: { total: 0, new: 0, contacted: 0, interested: 0, won: 0, lost: 0 },
    boutique: { total: 0, new: 0, contacted: 0, interested: 0, won: 0, lost: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [newLeadsCount, setNewLeadsCount] = useState({ food: 0, boutique: 0 })
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchDashboardData()
    checkNewLeads()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch managed leads from Supabase (with higher limit)
      const response = await fetch('/api/leads?limit=1000')
      const data = await response.json()
      
      if (data.success) {
        const leads = data.leads || []
        
        // Calculate stats for each source
        const foodLeads = leads.filter((l: any) => l.sheet_source === 'sheet_1_food')
        const boutiqueLeads = leads.filter((l: any) => l.sheet_source === 'sheet_2_boutique')
        
        setStats({
          food: calculateStats(foodLeads),
          boutique: calculateStats(boutiqueLeads)
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

  const calculateStats = (leads: any[]) => {
    // All leads with is_managed=true are considered managed, regardless of status
    const managedLeads = leads.filter(l => l.is_managed !== false)
    return {
      total: managedLeads.length,
      new: managedLeads.filter(l => !l.current_status || l.current_status === 'new').length,
      contacted: managedLeads.filter(l => l.current_status === 'contacted').length,
      interested: managedLeads.filter(l => l.current_status === 'interested').length,
      won: managedLeads.filter(l => l.current_status === 'won').length,
      lost: managedLeads.filter(l => l.current_status === 'lost').length
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
    checkNewLeads()
  }

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <p className="text-xs text-gray-600">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
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
                    <p className="text-sm text-gray-600">Total Managed Leads</p>
                  </div>
                  {newLeadsCount.food > 0 && (
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      +{newLeadsCount.food} New
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="New" value={stats.food.new} color="text-green-600" />
                  <StatCard label="Contacted" value={stats.food.contacted} color="text-blue-600" />
                  <StatCard label="Interested" value={stats.food.interested} color="text-yellow-600" />
                  <StatCard label="Won" value={stats.food.won} color="text-emerald-600" />
                  <StatCard label="Lost" value={stats.food.lost} color="text-red-600" />
                  <StatCard label="In Progress" value={stats.food.total - stats.food.won - stats.food.lost} color="text-purple-600" />
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
                    <p className="text-sm text-gray-600">Total Managed Leads</p>
                  </div>
                  {newLeadsCount.boutique > 0 && (
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      +{newLeadsCount.boutique} New
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="New" value={stats.boutique.new} color="text-green-600" />
                  <StatCard label="Contacted" value={stats.boutique.contacted} color="text-blue-600" />
                  <StatCard label="Interested" value={stats.boutique.interested} color="text-yellow-600" />
                  <StatCard label="Won" value={stats.boutique.won} color="text-emerald-600" />
                  <StatCard label="Lost" value={stats.boutique.lost} color="text-red-600" />
                  <StatCard label="In Progress" value={stats.boutique.total - stats.boutique.won - stats.boutique.lost} color="text-purple-600" />
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