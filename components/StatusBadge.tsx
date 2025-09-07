import React from 'react'

type LeadStatus = 'new' | 'contacted' | 'interested' | 'demo' | 'negotiation' | 'won' | 'lost'

interface StatusBadgeProps {
  status: LeadStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: 'text-green-800', bgColor: 'bg-green-100' },
  contacted: { label: 'Contacted', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  interested: { label: 'Interested', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  demo: { label: 'Demo', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  negotiation: { label: 'Negotiation', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  won: { label: 'Won', color: 'text-emerald-800', bgColor: 'bg-emerald-100' },
  lost: { label: 'Lost', color: 'text-red-800', bgColor: 'bg-red-100' },
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }
  
  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${config.bgColor} ${config.color} ${sizeClasses[size]}
    `}>
      {config.label}
    </span>
  )
}