import { Lead, LeadStatus } from '@/types/database'
import { X, Phone, MessageCircle, Mail, MapPin, Calendar, Tag, User } from 'lucide-react'
import { useState } from 'react'

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
  onStatusUpdate: (leadId: string, status: LeadStatus) => void
  isDemo?: boolean
}

export default function LeadDetailModal({ lead, onClose, onStatusUpdate, isDemo = false }: LeadDetailModalProps) {
  const [note, setNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [savedNotes, setSavedNotes] = useState<string[]>([])

  const handleAddNote = async () => {
    if (!note.trim()) return

    setIsAddingNote(true)
    
    if (isDemo) {
      // In demo mode, just add to local state
      setTimeout(() => {
        setSavedNotes([...savedNotes, note.trim()])
        setNote('')
        setIsAddingNote(false)
      }, 500)
    } else {
      // Production mode with Supabase
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from('lead_notes')
          .insert({
            lead_id: lead.id,
            note: note.trim(),
            created_by: user.id
          })

        if (error) throw error

        setNote('')
      } catch (error) {
        console.error('Error adding note:', error)
      } finally {
        setIsAddingNote(false)
      }
    }
  }

  const openWhatsApp = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanNumber}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Lead Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{lead.full_name || 'Unknown'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {lead.phone_number || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  {lead.whatsapp_number ? (
                    <button
                      onClick={() => openWhatsApp(lead.whatsapp_number!)}
                      className="text-sm font-medium text-green-600 hover:text-green-700"
                    >
                      {lead.whatsapp_number}
                    </button>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">Not provided</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    {lead.state || 'Not provided'}
                    {lead.city && `, ${lead.city}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Campaign</p>
                <p className="text-sm font-medium text-gray-900">{lead.campaign_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ad Set</p>
                <p className="text-sm font-medium text-gray-900">{lead.adset_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Form</p>
                <p className="text-sm font-medium text-gray-900">{lead.form_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Platform</p>
                <p className="text-sm font-medium text-gray-900">{lead.platform || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Management</h3>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-500">Current Status:</label>
              <select
                value={lead.current_status}
                onChange={(e) => onStatusUpdate(lead.id, e.target.value as LeadStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="demo">Demo</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Note</h3>
            <div className="space-y-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this lead..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={!note.trim() || isAddingNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Additional Information */}
          {lead.tool_requirement && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements</h3>
              <p className="text-sm text-gray-700">{lead.tool_requirement}</p>
            </div>
          )}

          {/* Display saved notes in demo mode */}
          {isDemo && savedNotes.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div className="space-y-2">
                {savedNotes.map((note, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{note}</p>
                    <p className="text-xs text-gray-500 mt-1">Just now</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}