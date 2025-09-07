import { LeadStatus } from '@/types/database'
import { Search, Filter } from 'lucide-react'

interface LeadFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: LeadStatus | 'all'
  onStatusChange: (value: LeadStatus | 'all') => void
  campaignFilter: string
  onCampaignChange: (value: string) => void
  campaigns: string[]
}

export default function LeadFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  campaignFilter,
  onCampaignChange,
  campaigns
}: LeadFiltersProps) {
  const statuses: (LeadStatus | 'all')[] = [
    'all',
    'new',
    'contacted',
    'interested',
    'demo',
    'negotiation',
    'won',
    'lost'
  ]

  const statusColors: Record<string, string> = {
    all: 'bg-gray-100 text-gray-800',
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    interested: 'bg-purple-100 text-purple-800',
    demo: 'bg-indigo-100 text-indigo-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or campaign..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as LeadStatus | 'all')}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={campaignFilter}
            onChange={(e) => onCampaignChange(e.target.value)}
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(campaign => (
              <option key={campaign} value={campaign}>
                {campaign}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(searchTerm || statusFilter !== 'all' || campaignFilter !== 'all') && (
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-gray-500">Active filters:</span>
          {searchTerm && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-700">
              Search: {searchTerm}
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className={`px-2 py-1 rounded-full ${statusColors[statusFilter]}`}>
              {statusFilter}
            </span>
          )}
          {campaignFilter !== 'all' && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-700">
              {campaignFilter}
            </span>
          )}
          <button
            onClick={() => {
              onSearchChange('')
              onStatusChange('all')
              onCampaignChange('all')
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}