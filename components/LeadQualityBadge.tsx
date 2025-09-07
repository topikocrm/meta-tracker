'use client'

import { LeadQuality, QUALITY_CONFIGS } from '@/lib/types'

interface LeadQualityBadgeProps {
  quality: LeadQuality
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

export default function LeadQualityBadge({ 
  quality, 
  size = 'md',
  showLabel = true,
  animated = true
}: LeadQualityBadgeProps) {
  const config = QUALITY_CONFIGS[quality]
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }
  
  const colorClasses = {
    hot: 'bg-red-500 text-white border-red-600',
    warm: 'bg-orange-500 text-white border-orange-600',
    cool: 'bg-blue-400 text-white border-blue-500',
    cold: 'bg-gray-400 text-white border-gray-500'
  }
  
  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        border-2 transition-all duration-200
        ${sizeClasses[size]}
        ${colorClasses[quality]}
        ${animated && quality === 'hot' ? 'animate-pulse shadow-lg' : ''}
        ${animated ? 'hover:scale-105' : ''}
      `}
      title={config.description}
    >
      <span className="text-base sm:text-lg">{config.icon}</span>
      {showLabel && (
        <span className="hidden sm:inline">{config.label}</span>
      )}
    </div>
  )
}