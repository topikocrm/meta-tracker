import { Lead, LeadStatus } from '@/types/database'
import { Phone, MessageCircle, User, Calendar, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import LeadDetailModal from './LeadDetailModal'

interface LeadTableProps {
  leads: Lead[]
  onStatusUpdate: (leadId: string, status: LeadStatus) => void
  isDemo?: boolean
}

export default function LeadTable({ leads, onStatusUpdate, isDemo = false }: LeadTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const statusColors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    interested: 'bg-purple-100 text-purple-800',
    demo: 'bg-indigo-100 text-indigo-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openWhatsApp = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanNumber}`, '_blank')
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lead.state || 'No location'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {lead.phone_number && (
                      <a
                        href={`tel:${lead.phone_number}`}
                        className="text-gray-500 hover:text-gray-700"
                        title="Call"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    {lead.whatsapp_number && (
                      <button
                        onClick={() => openWhatsApp(lead.whatsapp_number!)}
                        className="text-green-600 hover:text-green-700"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}
                    <span className="text-sm text-gray-900">
                      {lead.phone_number || lead.whatsapp_number || 'No contact'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {lead.campaign_name || 'No campaign'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {lead.form_name || 'No form'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={lead.current_status}
                    onChange={(e) => onStatusUpdate(lead.id, e.target.value as LeadStatus)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[lead.current_status]}`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="demo">Demo</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {lead.assigned_user?.name || 'Unassigned'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(lead.created_time)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={onStatusUpdate}
          isDemo={isDemo}
        />
      )}
    </>
  )
}