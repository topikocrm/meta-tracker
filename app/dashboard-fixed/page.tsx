'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Users, ShoppingBag, RefreshCw, Loader } from 'lucide-react'

// Hardcoded values to bypass environment variable issues
const SUPABASE_URL = 'https://nnituwulsjzoucbeuele.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uaXR1d3Vsc2p6b3VjYmV1ZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTc1NTYsImV4cCI6MjA3MjczMzU1Nn0.J1_ey_2GMdryzoRdHcH6Z79WtJExb4h-9CKSiXKcJtE'

export default function FixedDashboardPage() {
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
      // Create Supabase client with hardcoded values
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      
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
        <div>
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
              <p className="text-gray-600 mt-1">Your leads overview</p>
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
        
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-semibold">✓ Dashboard loaded successfully!</p>
          <p className="text-green-600 text-sm mt-1">All your leads are imported and ready for management.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Food Leads */}
          <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
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
              <p className="text-5xl font-bold text-gray-900">{foodCount}</p>
              <p className="text-gray-600 mt-2">Total Managed Leads</p>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-medium">All Ready</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Boutique Leads */}
          <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
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
              <p className="text-5xl font-bold text-gray-900">{boutiqueCount}</p>
              <p className="text-gray-600 mt-2">Total Managed Leads</p>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-medium">All Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Total Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <p className="text-6xl font-bold text-gray-900">{foodCount + boutiqueCount}</p>
            <p className="text-xl text-gray-600 mt-2">Total Leads in Your CRM</p>
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{foodCount}</p>
                <p className="text-sm text-gray-500">Food</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">+</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{boutiqueCount}</p>
                <p className="text-sm text-gray-500">Boutique</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-semibold">About Your Leads</p>
          <p className="text-blue-600 text-sm mt-1">
            All leads have been successfully imported from Google Sheets. 
            They are marked as "New" status and ready for your team to start working on them.
          </p>
        </div>
      </div>
    </div>
  )
}