'use client'

import { useState, useEffect } from 'react'

export default function DebugCountsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchDebugData() {
      try {
        // Fetch from simple API (with managed filter)
        const simpleResponse = await fetch('/api/leads/simple?limit=2000')
        const simpleData = await simpleResponse.json()
        
        // Fetch from simple API (without managed filter)
        const allResponse = await fetch('/api/leads/simple?limit=2000&include_unmanaged=true')
        const allData = await allResponse.json()
        
        // Fetch food specific
        const foodResponse = await fetch('/api/leads/simple?source=sheet_1_food&limit=1000')
        const foodData = await foodResponse.json()
        
        // Fetch boutique specific
        const boutiqueResponse = await fetch('/api/leads/simple?source=sheet_2_boutique&limit=1000')
        const boutiqueData = await boutiqueResponse.json()
        
        // Fetch services specific
        const servicesResponse = await fetch('/api/leads/simple?source=sheet_3_services&limit=1000')
        const servicesData = await servicesResponse.json()
        
        const result: any = {
          simpleAPI: {
            managedOnly: simpleData,
            all: allData
          },
          bySource: {
            food: foodData,
            boutique: boutiqueData,
            services: servicesData
          }
        }
        
        // Analyze the data
        if (simpleData.success && simpleData.leads) {
          const leads = simpleData.leads
          
          // Group by sheet_source
          const bySource = leads.reduce((acc: any, lead: any) => {
            const source = lead.sheet_source || 'unknown'
            acc[source] = (acc[source] || 0) + 1
            return acc
          }, {})
          
          // Group by is_managed
          const byManaged = leads.reduce((acc: any, lead: any) => {
            const managed = lead.is_managed
            const key = managed === true ? 'true' : managed === false ? 'false' : 'null_or_undefined'
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          
          // Group by lead_stage
          const byStage = leads.reduce((acc: any, lead: any) => {
            const stage = lead.lead_stage || 'null'
            acc[stage] = (acc[stage] || 0) + 1
            return acc
          }, {})
          
          // Check date fields
          const dateAnalysis = {
            hasCreatedTime: leads.filter((l: any) => l.created_time).length,
            hasCreatedAt: leads.filter((l: any) => l.created_at).length,
            hasBoth: leads.filter((l: any) => l.created_time && l.created_at).length,
            hasNeither: leads.filter((l: any) => !l.created_time && !l.created_at).length
          }
          
          // Today's leads
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const todayLeads = leads.filter((lead: any) => {
            const dateStr = lead.created_time || lead.created_at
            if (!dateStr) return false
            const leadDate = new Date(dateStr)
            const leadDateStart = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate())
            leadDateStart.setHours(0, 0, 0, 0)
            return leadDateStart >= today
          })
          
          result.analysis = {
            total: leads.length,
            bySource,
            byManaged,
            byStage,
            dateAnalysis,
            todayCount: todayLeads.length,
            todayLeads: todayLeads.slice(0, 5).map((l: any) => ({
              name: l.full_name,
              created_time: l.created_time,
              created_at: l.created_at,
              source: l.sheet_source
            }))
          }
        }
        
        // Analyze unmanaged data
        if (allData.success && allData.leads) {
          const allLeads = allData.leads
          const managedTrue = allLeads.filter((l: any) => l.is_managed === true)
          const managedFalse = allLeads.filter((l: any) => l.is_managed === false)
          const managedNull = allLeads.filter((l: any) => l.is_managed === null)
          const managedUndefined = allLeads.filter((l: any) => l.is_managed === undefined)
          
          result.unmanagedAnalysis = {
            total: allLeads.length,
            managed_true: managedTrue.length,
            managed_false: managedFalse.length,
            managed_null: managedNull.length,
            managed_undefined: managedUndefined.length,
            foodTotal: allLeads.filter((l: any) => l.sheet_source === 'sheet_1_food').length,
            boutiqueTotal: allLeads.filter((l: any) => l.sheet_source === 'sheet_2_boutique').length,
            servicesTotal: allLeads.filter((l: any) => l.sheet_source === 'sheet_3_services').length,
            foodManaged: allLeads.filter((l: any) => l.sheet_source === 'sheet_1_food' && l.is_managed === true).length,
            boutiqueManaged: allLeads.filter((l: any) => l.sheet_source === 'sheet_2_boutique' && l.is_managed === true).length,
            servicesManaged: allLeads.filter((l: any) => l.sheet_source === 'sheet_3_services' && l.is_managed === true).length
          }
        }
        
        setData(result)
      } catch (error) {
        console.error('Error fetching debug data:', error)
        setData({ error: String(error) })
      } finally {
        setLoading(false)
      }
    }
    
    fetchDebugData()
  }, [])
  
  if (loading) {
    return <div className="p-8">Loading debug data...</div>
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lead Count Debug Information</h1>
      
      {data?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {data.error}
        </div>
      )}
      
      {data?.unmanagedAnalysis && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Leads Analysis (Including Unmanaged)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Total Counts</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                Total in DB: {data.unmanagedAnalysis.total}
                Managed (true): {data.unmanagedAnalysis.managed_true}
                Managed (false): {data.unmanagedAnalysis.managed_false}
                Managed (null): {data.unmanagedAnalysis.managed_null}
                Managed (undefined): {data.unmanagedAnalysis.managed_undefined}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">By Source</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                Food Total: {data.unmanagedAnalysis.foodTotal}
                Food Managed: {data.unmanagedAnalysis.foodManaged}
                Boutique Total: {data.unmanagedAnalysis.boutiqueTotal}
                Boutique Managed: {data.unmanagedAnalysis.boutiqueManaged}
                Services Total: {data.unmanagedAnalysis.servicesTotal}
                Services Managed: {data.unmanagedAnalysis.servicesManaged}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      {data?.analysis && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Managed Leads Analysis (Default API Filter)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">By Source</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {JSON.stringify(data.analysis.bySource, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">By Stage</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {JSON.stringify(data.analysis.byStage, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Date Field Analysis</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {JSON.stringify(data.analysis.dateAnalysis, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Today Filter</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                Today's Leads: {data.analysis.todayCount}
                Sample:
                {JSON.stringify(data.analysis.todayLeads, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      {data?.bySource && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Responses by Source</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Food API Response</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                Success: {data.bySource.food.success ? 'Yes' : 'No'}
                Count: {data.bySource.food.count}
                Metadata: {JSON.stringify(data.bySource.food.metadata, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Boutique API Response</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                Success: {data.bySource.boutique.success ? 'Yes' : 'No'}
                Count: {data.bySource.boutique.count}
                Metadata: {JSON.stringify(data.bySource.boutique.metadata, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Services API Response</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                Success: {data.bySource.services?.success ? 'Yes' : 'No'}
                Count: {data.bySource.services?.count || 0}
                Metadata: {JSON.stringify(data.bySource.services?.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p className="font-semibold">Check the browser console for additional debug logs from the API and page components.</p>
      </div>
    </div>
  )
}