'use client'

import React, { useState } from 'react'
import { ChevronRight, CheckCircle } from 'lucide-react'

type LeadStatus = 'new' | 'contacted' | 'interested' | 'demo' | 'negotiation' | 'won' | 'lost'

interface StatusSelectorProps {
  currentStatus: LeadStatus
  leadId: string
  onStatusChange: (newStatus: LeadStatus) => Promise<void>
  showPipeline?: boolean
}

const statusFlow: LeadStatus[] = ['new', 'contacted', 'interested', 'demo', 'negotiation', 'won']

const statusConfig: Record<LeadStatus, { label: string; color: string; description: string }> = {
  new: { label: 'New', color: 'bg-green-500', description: 'Fresh lead, not contacted yet' },
  contacted: { label: 'Contacted', color: 'bg-blue-500', description: 'Initial contact made' },
  interested: { label: 'Interested', color: 'bg-yellow-500', description: 'Showed interest in product' },
  demo: { label: 'Demo', color: 'bg-purple-500', description: 'Demo scheduled or completed' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500', description: 'Discussing terms' },
  won: { label: 'Won', color: 'bg-emerald-500', description: 'Deal closed successfully' },
  lost: { label: 'Lost', color: 'bg-red-500', description: 'Lead did not convert' },
}

export default function StatusSelector({ 
  currentStatus, 
  leadId,
  onStatusChange,
  showPipeline = true
}: StatusSelectorProps) {
  const [isChanging, setIsChanging] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === currentStatus) return
    
    setIsChanging(true)
    try {
      await onStatusChange(newStatus)
      setSelectedStatus(newStatus)
    } catch (error) {
      console.error('Failed to change status:', error)
      setSelectedStatus(currentStatus)
    }
    setIsChanging(false)
  }
  
  const currentIndex = statusFlow.indexOf(currentStatus)
  
  return (
    <div className="space-y-4">
      {/* Pipeline View */}
      {showPipeline && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          {statusFlow.map((status, index) => {
            const isActive = index <= currentIndex
            const isCurrent = status === currentStatus
            
            return (
              <React.Fragment key={status}>
                <button
                  onClick={() => handleStatusChange(status)}
                  disabled={isChanging}
                  className={`
                    flex flex-col items-center gap-1 px-2 py-1 rounded transition-all
                    ${isCurrent ? 'scale-110' : ''}
                    ${isActive ? 'opacity-100' : 'opacity-50'}
                    ${!isChanging ? 'hover:bg-white hover:shadow-sm cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white text-xs
                    ${isActive ? statusConfig[status].color : 'bg-gray-300'}
                  `}>
                    {isCurrent ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {statusConfig[status].label}
                  </span>
                </button>
                {index < statusFlow.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}
      
      {/* Dropdown Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          disabled={isChanging}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(statusConfig).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label} - {config.description}
            </option>
          ))}
        </select>
      </div>
      
      {/* Lost Reason (if status is lost) */}
      {selectedStatus === 'lost' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lost Reason
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select reason...</option>
            <option value="budget">Budget constraints</option>
            <option value="competitor">Went with competitor</option>
            <option value="no-response">No response</option>
            <option value="not-ready">Not ready to purchase</option>
            <option value="not-suitable">Product not suitable</option>
            <option value="other">Other</option>
          </select>
        </div>
      )}
    </div>
  )
}