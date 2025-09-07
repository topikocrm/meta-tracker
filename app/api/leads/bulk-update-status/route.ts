import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Bulk update lead status
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    const { sheet_source, from_status, to_status } = body
    
    // Update all leads matching criteria
    let query = supabase
      .from('leads')
      .update({ 
        current_status: to_status,
        updated_at: new Date().toISOString()
      })
    
    if (sheet_source) {
      query = query.eq('sheet_source', sheet_source)
    }
    
    if (from_status) {
      query = query.eq('current_status', from_status)
    }
    
    const { data, error, count } = await query.select('id')
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: `Updated ${data?.length || 0} leads from ${from_status || 'any'} to ${to_status}`,
      count: data?.length || 0
    })
    
  } catch (error) {
    console.error('Failed to bulk update leads:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to bulk update leads' 
      },
      { status: 500 }
    )
  }
}