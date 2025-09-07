import { Lead } from '@/types/database'
import { Users, TrendingUp, Clock, DollarSign } from 'lucide-react'

interface DashboardStatsProps {
  leads: Lead[]
}

export default function DashboardStats({ leads }: DashboardStatsProps) {
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.current_status === 'new').length,
    inProgress: leads.filter(l => ['contacted', 'interested', 'demo', 'negotiation'].includes(l.current_status)).length,
    won: leads.filter(l => l.current_status === 'won').length,
    lost: leads.filter(l => l.current_status === 'lost').length,
    conversionRate: leads.length > 0 
      ? ((leads.filter(l => l.current_status === 'won').length / leads.length) * 100).toFixed(1)
      : '0',
    totalValue: leads
      .filter(l => l.current_status === 'won')
      .reduce((sum, l) => sum + (l.conversion_value || 0), 0)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Leads</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.new} new, {stats.inProgress} in progress
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.won} won, {stats.lost} lost
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Active Leads</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
            <p className="text-xs text-gray-500 mt-1">
              Requires follow-up
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Value</p>
            <p className="text-2xl font-semibold text-gray-900">
              ₹{stats.totalValue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              From {stats.won} conversions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}