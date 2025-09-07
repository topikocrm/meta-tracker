'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Calendar, Clock, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react'
import { Lead, LeadStage, LeadQuality } from '@/lib/types'
import LeadQualityBadge from './LeadQualityBadge'
import PipelineStageTracker from './PipelineStageTracker'

interface EnhancedLeadCardProps {
  lead: Lead
  onClick?: () => void
  onStageChange?: (stage: LeadStage) => void
  variant?: 'full' | 'compact' | 'mobile'
}

export default function EnhancedLeadCard({
  lead,
  onClick,
  onStageChange,
  variant = 'full'
}: EnhancedLeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = variant === 'mobile'
  
  // Calculate days since creation
  const daysSinceCreation = lead.created_time 
    ? Math.floor((Date.now() - new Date(lead.created_time).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Mobile compact view
  if (isMobile) {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer"
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {lead.full_name || 'Unknown'}
            </h3>
            <p className="text-xs text-gray-500">
              {lead.phone_number || 'No phone'}
            </p>
          </div>
          <LeadQualityBadge quality={lead.lead_quality} size="sm" showLabel={false} />
        </div>
        
        {/* Stage Progress */}
        <div className="mb-3">
          <PipelineStageTracker 
            currentStage={lead.lead_stage}
            variant="compact"
            showProgress={true}
          />
        </div>
        
        {/* Quick Stats */}
        <div className="flex justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lead.days_in_stage || 0}d in stage
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {daysSinceCreation}d old
          </span>
        </div>
        
        {/* Expand button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {isExpanded ? 'Less' : 'More'} Details
        </button>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
            {lead.assigned_user && (
              <div className="flex justify-between">
                <span className="text-gray-500">Assigned:</span>
                <span className="font-medium">{lead.assigned_user.name}</span>
              </div>
            )}
            {lead.interest_level && (
              <div className="flex justify-between">
                <span className="text-gray-500">Interest:</span>
                <span className="font-medium capitalize">{lead.interest_level}</span>
              </div>
            )}
            {lead.next_action && (
              <div className="flex justify-between">
                <span className="text-gray-500">Next:</span>
                <span className="font-medium">{lead.next_action.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  
  // Compact view for tables
  if (variant === 'compact') {
    return (
      <tr 
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <LeadQualityBadge quality={lead.lead_quality} size="sm" showLabel={false} />
            <div>
              <div className="font-medium text-gray-900">{lead.full_name}</div>
              <div className="text-sm text-gray-500">{lead.phone_number}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <PipelineStageTracker 
            currentStage={lead.lead_stage}
            variant="compact"
            showProgress={false}
          />
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {lead.assigned_user?.name || 'Unassigned'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {lead.days_in_stage || 0} days
        </td>
        <td className="px-4 py-3">
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </td>
      </tr>
    )
  }
  
  // Full desktop view
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                {lead.full_name || 'Unknown Lead'}
              </h3>
              <LeadQualityBadge quality={lead.lead_quality} size="md" />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {lead.phone_number || 'No phone'}
              </span>
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {lead.email}
                </span>
              )}
              {lead.state && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {lead.state}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Pipeline Progress */}
      <div className="p-4 border-b border-gray-200">
        <PipelineStageTracker 
          currentStage={lead.lead_stage}
          onStageClick={onStageChange}
          variant="full"
          showProgress={true}
        />
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {lead.contact_attempts || 0}
          </div>
          <div className="text-xs text-gray-500">Contact Attempts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {lead.days_in_stage || 0}
          </div>
          <div className="text-xs text-gray-500">Days in Stage</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {daysSinceCreation}
          </div>
          <div className="text-xs text-gray-500">Total Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {lead.pipeline_progress}%
          </div>
          <div className="text-xs text-gray-500">Progress</div>
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Status */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500">Contact Status</div>
          <div className="font-medium text-gray-900 capitalize">
            {lead.contact_status?.replace(/_/g, ' ') || 'Not Attempted'}
          </div>
        </div>
        
        {/* Interest Level */}
        {lead.interest_level && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500">Interest Level</div>
            <div className="font-medium text-gray-900 capitalize">
              {lead.interest_level}
            </div>
          </div>
        )}
        
        {/* Assigned To */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500">Assigned To</div>
          <div className="font-medium text-gray-900">
            {lead.assigned_user?.name || 'Unassigned'}
          </div>
        </div>
        
        {/* Next Action */}
        {lead.next_action && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500">Next Action</div>
            <div className="font-medium text-gray-900 capitalize">
              {lead.next_action.replace(/_/g, ' ')}
            </div>
          </div>
        )}
        
        {/* Follow-up Date */}
        {lead.follow_up_date && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500">Follow-up</div>
            <div className="font-medium text-gray-900">
              {new Date(lead.follow_up_date).toLocaleDateString()}
            </div>
          </div>
        )}
        
        {/* Lost Reason */}
        {lead.lost_reason && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500">Lost Reason</div>
            <div className="font-medium text-red-600">
              {lead.lost_reason}
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
        <button 
          onClick={onClick}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Details
        </button>
        {lead.phone_number && (
          <button 
            onClick={() => window.open(`tel:${lead.phone_number}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}