'use client'

import { LeadStage, STAGE_CONFIGS } from '@/lib/types'
import { ChevronRight, Check } from 'lucide-react'

interface PipelineStageTrackerProps {
  currentStage: LeadStage
  onStageClick?: (stage: LeadStage) => void
  variant?: 'full' | 'compact' | 'mobile'
  showProgress?: boolean
}

// Flexible pipeline - shows relevant stages based on current path
const getRelevantStages = (currentStage: LeadStage): LeadStage[] => {
  // Always start with these
  const baseStages: LeadStage[] = ['new', 'contacted', 'qualified']
  
  // Add stages based on what path the lead is taking
  if (currentStage === 'demo_scheduled' || currentStage === 'demo_completed') {
    baseStages.push('demo_scheduled', 'demo_completed')
  }
  
  if (currentStage === 'trial_started') {
    baseStages.push('trial_started')
  }
  
  // Always end with won
  baseStages.push('won')
  
  // Remove duplicates and return
  return Array.from(new Set(baseStages))
}

const PIPELINE_STAGES: LeadStage[] = [
  'new',
  'contacted',
  'qualified',
  'demo_scheduled',
  'demo_completed',
  'trial_started',
  'won'
]

export default function PipelineStageTracker({
  currentStage,
  onStageClick,
  variant = 'full',
  showProgress = true
}: PipelineStageTrackerProps) {
  // Ensure we have a valid stage
  const validStage = currentStage && STAGE_CONFIGS[currentStage] ? currentStage : 'new'
  const currentIndex = PIPELINE_STAGES.indexOf(validStage)
  const progress = STAGE_CONFIGS[validStage]?.progress || 0
  
  // Mobile variant - vertical stepper
  if (variant === 'mobile') {
    return (
      <div className="w-full">
        {showProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {PIPELINE_STAGES.map((stage, index) => {
            const config = STAGE_CONFIGS[stage]
            const isPast = index < currentIndex
            const isCurrent = stage === validStage
            const isFuture = index > currentIndex
            
            return (
              <div
                key={stage}
                className={`
                  flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${isCurrent ? 'bg-blue-500 text-white scale-105' : ''}
                  ${isPast ? 'bg-green-100 text-green-700' : ''}
                  ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                  cursor-default
                `}
                title={onStageClick ? '' : 'Stages advance automatically based on Track tab selections'}
              >
                <div className="flex items-center gap-1">
                  {isPast && <Check className="h-3 w-3" />}
                  <span>{config.icon}</span>
                  <span className="whitespace-nowrap">{config.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  
  // Compact variant - for tables
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-lg">{STAGE_CONFIGS[validStage]?.icon || '🆕'}</span>
        <div className="flex-1">
          <div className="text-sm font-medium">{STAGE_CONFIGS[validStage]?.label || 'New'}</div>
          <div className="text-xs text-gray-500">Stage {currentIndex + 1}/{PIPELINE_STAGES.length}</div>
        </div>
        {showProgress && (
          <div className="w-20">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Full variant - desktop
  return (
    <div className="w-full">
      {!onStageClick && (
        <div className="mb-3 text-xs text-gray-500 italic flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pipeline advances automatically based on your selections in the Track tab
        </div>
      )}
      {showProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">{STAGE_CONFIGS[currentStage].label}</span>
            <span>{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="hidden lg:flex items-center justify-between">
        {PIPELINE_STAGES.map((stage, index) => {
          const config = STAGE_CONFIGS[stage]
          const isPast = index < currentIndex
          const isCurrent = stage === currentStage
          const isFuture = index > currentIndex
          
          return (
            <div key={stage} className="flex items-center flex-1">
              <div
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200
                  ${isCurrent ? 'scale-110 bg-white shadow-lg' : ''}
                  cursor-default
                  ${isFuture ? 'opacity-50' : ''}
                `}
                title={onStageClick ? config.description : `${config.description}\n\nStages advance automatically based on selections in the Track tab`}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-white text-sm
                  ${isPast ? 'bg-green-500' : ''}
                  ${isCurrent ? 'bg-blue-500' : ''}
                  ${isFuture ? 'bg-gray-300' : ''}
                `}>
                  {isPast ? <Check className="h-5 w-5" /> : config.icon}
                </div>
                <span className={`
                  text-xs font-medium
                  ${isCurrent ? 'text-blue-600' : 'text-gray-600'}
                `}>
                  {config.label}
                </span>
              </div>
              
              {index < PIPELINE_STAGES.length - 1 && (
                <ChevronRight className={`
                  h-4 w-4 mx-1
                  ${index < currentIndex ? 'text-green-500' : 'text-gray-300'}
                `} />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Mobile/Tablet view */}
      <div className="lg:hidden">
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {PIPELINE_STAGES.map((stage, index) => {
            const config = STAGE_CONFIGS[stage]
            const isPast = index < currentIndex
            const isCurrent = stage === validStage
            const isFuture = index > currentIndex
            
            return (
              <div
                key={stage}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg font-medium
                  transition-all duration-200
                  ${isCurrent ? 'bg-blue-500 text-white' : ''}
                  ${isPast ? 'bg-green-100 text-green-700' : ''}
                  ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                  cursor-default
                `}
                title={onStageClick ? '' : 'Stages advance automatically based on Track tab selections'}
              >
                <div className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span className="text-sm">{config.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Current stage details */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Next Action:</p>
            <p className="text-xs text-gray-600">{STAGE_CONFIGS[currentStage].nextAction}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Success Criteria:</p>
            <p className="text-xs text-gray-600">{STAGE_CONFIGS[currentStage].successCriteria}</p>
          </div>
        </div>
      </div>
    </div>
  )
}