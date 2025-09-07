'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaticDashboard() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to a simple HTML page
    window.location.href = '/dashboard.html'
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="text-center">
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}