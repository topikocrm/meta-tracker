'use client'

import { useState } from 'react'
import { Database, RefreshCw, Users, CheckCircle, XCircle, Loader, UserPlus } from 'lucide-react'

export default function TestSupabasePage() {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Test user creation
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as const,
    location: ''
  })

  // Initial sync - import all existing leads
  const initialSync = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/sync/initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Initial sync failed')
      }
      
      setSyncStatus(data)
      // Refresh leads after sync
      await fetchLeads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initial sync failed')
      console.error('Sync error:', err)
    }
    setIsLoading(false)
  }
  
  // Check for new leads (lightweight)
  const checkNewLeads = async () => {
    try {
      const response = await fetch('/api/leads/check-new')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check new leads')
      }
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check new leads')
      console.error('Check new leads error:', err)
      return null
    }
  }
  
  // Sync call_assigned_to values
  const syncAssignments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/sync/assign-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Assignment sync failed')
      }
      
      alert(`Assignment sync completed!\n
Users created: ${data.summary?.usersCreated || 0}
Users existing: ${data.summary?.usersExisting || 0}
Leads updated: ${data.summary?.leadsUpdated || 0}
Assignees found: ${data.summary?.assigneeNames?.join(', ') || 'None'}`)
      
      // Refresh data
      await fetchUsers()
      await fetchLeads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment sync failed')
      console.error('Assignment sync error:', err)
    }
    setIsLoading(false)
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }
      
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      console.error('Fetch users error:', err)
    }
  }

  // Fetch leads
  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?limit=10')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leads')
      }
      
      setLeads(data.leads || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads')
      console.error('Fetch leads error:', err)
    }
  }

  // Create a user
  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError('Name and email are required')
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }
      
      // Reset form and refresh users
      setNewUser({ name: '', email: '', phone: '', role: 'user', location: '' })
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
      console.error('Create user error:', err)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supabase Integration Test</h1>
              <p className="text-gray-600">Test database connection and sync functionality</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Important Notice */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Before Testing:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
              <li>✅ Your .env.local is configured with Supabase credentials</li>
              <li>Run these SQL files in Supabase SQL Editor:</li>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>First: /supabase/schema.sql (main tables)</li>
                <li>Then: /supabase/sync_metadata.sql (tracking table)</li>
              </ul>
              <li>Create at least one user before importing leads</li>
            </ol>
          </div>

          {/* Create User Section */}
          <div className="mb-8 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create User (Required for CRM)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Name *"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                value={newUser.location}
                onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={createUser}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create User
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={initialSync}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Initial Import (All Leads)
            </button>
            
            <button
              onClick={async () => {
                const newData = await checkNewLeads()
                if (newData) {
                  alert(`Found ${newData.newLeadsFound} new leads across ${newData.sheetsChecked} sheets`)
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Database className="h-4 w-4" />
              Check for New Leads
            </button>
            
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Users className="h-4 w-4" />
              Fetch Users
            </button>
            
            <button
              onClick={fetchLeads}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Database className="h-4 w-4" />
              Fetch Leads
            </button>
            
            <button
              onClick={syncAssignments}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Sync Assignments from Sheets
            </button>
          </div>

          {/* Sync Status */}
          {syncStatus && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Sync Completed
              </h3>
              <div className="text-sm text-green-800">
                <p>Timestamp: {syncStatus.timestamp}</p>
                <div className="mt-2">
                  {syncStatus.results?.map((result: any, idx: number) => (
                    <div key={idx} className="mb-1">
                      <strong>{result.sheet}:</strong> {result.success ? '✅' : '❌'} 
                      {result.success && ` - Processed: ${result.processed}, Added: ${result.added}, Updated: ${result.updated}`}
                      {result.error && ` - Error: ${result.error}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          {users.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Users ({users.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{user.location || '-'}</td>
                        <td className="px-4 py-2 text-xs text-gray-400 font-mono">{user.id.slice(0, 8)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leads List */}
          {leads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Leads ({leads.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{lead.full_name || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{lead.phone_number || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            lead.current_status === 'new' ? 'bg-green-100 text-green-800' :
                            lead.current_status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                            lead.current_status === 'won' ? 'bg-purple-100 text-purple-800' :
                            lead.current_status === 'lost' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.current_status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{lead.sheet_source || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {lead.assigned_user?.name || 'Unassigned'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {lead.created_time ? new Date(lead.created_time).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Create at least one user using the form above</li>
              <li>Click "Sync Google Sheets to Supabase" to import your leads</li>
              <li>Verify leads appear in the table below</li>
              <li>Go back to /test-sheets to see the CRM features in action</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}