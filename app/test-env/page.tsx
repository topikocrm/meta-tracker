'use client'

import { useState, useEffect } from 'react'

export default function TestEnvPage() {
  const [envData, setEnvData] = useState<any>(null)
  
  useEffect(() => {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT SET'
    
    setEnvData({
      url: supabaseUrl,
      urlLength: supabaseUrl.length,
      key: supabaseKey.substring(0, 20) + '...',
      keyLength: supabaseKey.length,
      hasNewline: supabaseKey.includes('\n'),
      hasCarriageReturn: supabaseKey.includes('\r'),
      hasSpace: supabaseKey.includes(' '),
      firstChar: supabaseKey.charCodeAt(0),
      lastChar: supabaseKey.charCodeAt(supabaseKey.length - 1)
    })
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Variable Test</h1>
        
        {envData && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <p className="font-semibold">Supabase URL:</p>
              <p className="text-sm text-gray-600">{envData.url}</p>
              <p className="text-xs text-gray-500">Length: {envData.urlLength}</p>
            </div>
            
            <div>
              <p className="font-semibold">Supabase Anon Key (first 20 chars):</p>
              <p className="text-sm text-gray-600">{envData.key}</p>
              <p className="text-xs text-gray-500">Length: {envData.keyLength}</p>
              <p className="text-xs text-gray-500">Has newline: {String(envData.hasNewline)}</p>
              <p className="text-xs text-gray-500">Has carriage return: {String(envData.hasCarriageReturn)}</p>
              <p className="text-xs text-gray-500">Has space: {String(envData.hasSpace)}</p>
              <p className="text-xs text-gray-500">First char code: {envData.firstChar}</p>
              <p className="text-xs text-gray-500">Last char code: {envData.lastChar}</p>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800">Expected key length: 223</p>
              <p className="text-sm text-yellow-700">
                If the length is not 223, there may be extra characters or line breaks.
              </p>
            </div>
            
            <div className="mt-4">
              <p className="font-semibold">Correct Supabase Key (copy this to Vercel):</p>
              <div className="mt-2 p-3 bg-gray-100 rounded font-mono text-xs break-all">
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uaXR1d3Vsc2p6b3VjYmV1ZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTc1NTYsImV4cCI6MjA3MjczMzU1Nn0.J1_ey_2GMdryzoRdHcH6Z79WtJExb4h-9CKSiXKcJtE
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}