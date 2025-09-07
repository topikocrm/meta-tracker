'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, Clock, User } from 'lucide-react'

interface Comment {
  id: string
  note: string
  created_at: string
  created_by: string
  user?: {
    name: string
    email: string
  }
}

interface CommentSectionProps {
  leadId: string
  currentUserId?: string
}

export default function CommentSection({ leadId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  useEffect(() => {
    if (leadId) {
      fetchComments()
    }
  }, [leadId])
  
  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`)
      const data = await response.json()
      if (data.success) {
        setComments(data.notes || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
    setIsLoading(false)
  }
  
  const addComment = async () => {
    if (!newComment.trim()) return
    
    setIsSending(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newComment,
          created_by: currentUserId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setComments([data.note, ...comments])
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
    setIsSending(false)
  }
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60))
      return `${mins} min${mins !== 1 ? 's' : ''} ago`
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else if (hours < 168) {
      const days = Math.floor(hours / 24)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }
  
  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments & Notes
        </h3>
      </div>
      
      {/* Add Comment */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a note or comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                addComment()
              }
            }}
          />
          <button
            onClick={addComment}
            disabled={!newComment.trim() || isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Press Ctrl+Enter to send</p>
      </div>
      
      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No comments yet. Add the first note!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-100 rounded-full">
                      <User className="h-3 w-3 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {comment.user?.name || 'Unknown User'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap pl-7">
                  {comment.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}