'use client'

import React, { useState, useEffect } from 'react'
import { User } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

interface AssignmentSelectorProps {
  currentAssignee?: string
  leadId?: string
  onAssign: (userId: string) => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function AssignmentSelector({ 
  currentAssignee, 
  leadId,
  onAssign,
  size = 'md',
  showLabel = true
}: AssignmentSelectorProps) {
  const [users, setUsers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selected, setSelected] = useState(currentAssignee || '')
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  useEffect(() => {
    setSelected(currentAssignee || '')
  }, [currentAssignee])
  
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }
  
  const handleAssign = async (userId: string) => {
    if (userId === selected) return
    
    setIsLoading(true)
    try {
      await onAssign(userId)
      setSelected(userId)
    } catch (error) {
      console.error('Failed to assign:', error)
      // Revert on error
      setSelected(currentAssignee || '')
    }
    setIsLoading(false)
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          <User className="h-4 w-4" />
          Assigned To:
        </label>
      )}
      <select
        value={selected}
        onChange={(e) => handleAssign(e.target.value)}
        disabled={isLoading}
        className={`
          border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
          ${sizeClasses[size]} ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <option value="">Unassigned</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
    </div>
  )
}