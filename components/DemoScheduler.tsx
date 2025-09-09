'use client'

import { useState } from 'react'
import { Calendar, Clock, User, MapPin, FileText } from 'lucide-react'

interface DemoSchedulerProps {
  leadId: string
  initialData?: {
    demo_date?: string
    demo_time?: string
    demo_type?: 'in_person' | 'online' | 'phone'
    demo_location?: string
    demo_notes?: string
    demo_presenter?: string
  }
  onSchedule: (data: any) => Promise<void>
  isOpen: boolean
  onClose: () => void
}

export default function DemoScheduler({
  leadId,
  initialData = {},
  onSchedule,
  isOpen,
  onClose
}: DemoSchedulerProps) {
  const [demoDate, setDemoDate] = useState(initialData.demo_date || '')
  const [demoTime, setDemoTime] = useState(initialData.demo_time || '')
  const [demoType, setDemoType] = useState<'in_person' | 'online' | 'phone'>(initialData.demo_type || 'online')
  const [demoLocation, setDemoLocation] = useState(initialData.demo_location || '')
  const [demoNotes, setDemoNotes] = useState(initialData.demo_notes || '')
  const [demoPresenter, setDemoPresenter] = useState(initialData.demo_presenter || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!demoDate || !demoTime) {
      alert('Please select both date and time for the demo')
      return
    }

    setIsSubmitting(true)
    
    const demoData = {
      demo_date: demoDate,
      demo_time: demoTime,
      demo_type: demoType,
      demo_location: demoLocation,
      demo_notes: demoNotes,
      demo_presenter: demoPresenter,
      demo_scheduled_at: new Date().toISOString(),
      lead_stage: 'demo_scheduled',
      next_action: 'conduct_demo'
    }

    try {
      await onSchedule(demoData)
      onClose()
    } catch (error) {
      console.error('Failed to schedule demo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Schedule Demo
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Demo Date
              </label>
              <input
                type="date"
                value={demoDate}
                onChange={(e) => setDemoDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="inline h-4 w-4 mr-1" />
                Demo Time
              </label>
              <input
                type="time"
                value={demoTime}
                onChange={(e) => setDemoTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Demo Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demo Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoType('online')}
                className={`p-2 rounded-lg border-2 transition-all text-sm ${
                  demoType === 'online'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                💻 Online
              </button>
              <button
                type="button"
                onClick={() => setDemoType('in_person')}
                className={`p-2 rounded-lg border-2 transition-all text-sm ${
                  demoType === 'in_person'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                🤝 In Person
              </button>
              <button
                type="button"
                onClick={() => setDemoType('phone')}
                className={`p-2 rounded-lg border-2 transition-all text-sm ${
                  demoType === 'phone'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                📞 Phone
              </button>
            </div>
          </div>

          {/* Location/Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              {demoType === 'online' ? 'Meeting Link' : 'Location/Address'}
            </label>
            <input
              type="text"
              value={demoLocation}
              onChange={(e) => setDemoLocation(e.target.value)}
              placeholder={demoType === 'online' ? 'Zoom/Meet link' : 'Address or phone number'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Presenter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline h-4 w-4 mr-1" />
              Demo Presenter
            </label>
            <input
              type="text"
              value={demoPresenter}
              onChange={(e) => setDemoPresenter(e.target.value)}
              placeholder="Name of person conducting the demo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline h-4 w-4 mr-1" />
              Demo Notes
            </label>
            <textarea
              value={demoNotes}
              onChange={(e) => setDemoNotes(e.target.value)}
              placeholder="Key points to cover, special requirements, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Demo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}