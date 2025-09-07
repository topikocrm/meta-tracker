'use client'

import { useState, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Users, ShoppingBag, RefreshCw, Loader } from 'lucide-react'

export default function DirectDashboardPage() {
  const router = useRouter()
  const [foodCount, setFoodCount] = useState(0)
  const [boutiqueCount, setBoutiqueCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchCounts()
  }, [])
  
  const fetchCounts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClientSupabase()
      
      // Get food leads count
      const { count: foodTotal, error: foodError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('sheet_source', 'sheet_1_food')
      
      if (foodError) throw foodError
      
      // Get boutique leads count
      const { count: boutiqueTotal, error: boutiqueError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('sheet_source', 'sheet_2_boutique')
      
      if (boutiqueError) throw boutiqueError
      
      setFoodCount(foodTotal || 0)
      setBoutiqueCount(boutiqueTotal || 0)
      
    } catch (err) {
      console.error('Error fetching counts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    }
    
    setIsLoading(false)
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchCounts}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Direct Dashboard</h1>
              <p className="text-gray-600 mt-1">Live data from Supabase</p>
            </div>
            <button
              onClick={fetchCounts}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Food Leads */}
          <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl"
            onClick={() => router.push('/leads-dashboard/food')}
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
              <div className="flex items-center gap-4">
                <ShoppingBag className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Food Leads</h2>
                  <p className="text-orange-100">Restaurant & Food Business</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-gray-900">{foodCount}</p>
              <p className="text-gray-600 mt-2">Total Leads in Database</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">All leads are managed and ready for CRM tracking</p>
              </div>
            </div>
          </div>
          
          {/* Boutique Leads */}
          <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl"
            onClick={() => router.push('/leads-dashboard/boutique')}
          >
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Boutique Leads</h2>
                  <p className="text-purple-100">Fashion & Boutique Business</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-gray-900">{boutiqueCount}</p>
              <p className="text-gray-600 mt-2">Total Leads in Database</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">All leads are managed and ready for CRM tracking</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Total Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900">{foodCount + boutiqueCount}</p>
            <p className="text-xl text-gray-600 mt-2">Total Leads in Your CRM</p>
            <p className="text-sm text-gray-500 mt-4">
              All leads have been imported from Google Sheets and are ready for management
            </p>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/test-supabase')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h4 className="font-medium text-gray-900">Sync Settings</h4>
            <p className="text-sm text-gray-600 mt-1">Manage data sync</p>
          </button>
          <button
            onClick={() => router.push('/leads-dashboard')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h4 className="font-medium text-gray-900">Full Dashboard</h4>
            <p className="text-sm text-gray-600 mt-1">View detailed stats</p>
          </button>
          <button
            onClick={() => router.push('/test-sheets')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h4 className="font-medium text-gray-900">Raw Data</h4>
            <p className="text-sm text-gray-600 mt-1">View Google Sheets</p>
          </button>
        </div>
      </div>
    </div>
  )
}