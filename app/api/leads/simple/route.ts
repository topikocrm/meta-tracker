import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// GET - Simple fetch of leads without any joins
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '1000')
    const source = searchParams.get('source')
    const includeUnmanaged = searchParams.get('include_unmanaged') === 'true'
    
    let query = supabase
      .from('leads')
      .select(`
        *,
        assigned_user:users!assigned_to(id, name, email)
      `)
      .order('created_time', { ascending: false })
      .limit(limit)
    
    // Filter for managed leads by default (unless explicitly requested)
    if (!includeUnmanaged) {
      query = query.eq('is_managed', true)
    }
    
    if (source) {
      query = query.eq('sheet_source', source)
    }
    
    const { data: leads, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    // Log for debugging
    console.log(`[API /leads/simple] Fetched ${leads?.length || 0} leads for source: ${source || 'all'}, managed only: ${!includeUnmanaged}`)
    
    return NextResponse.json({
      success: true,
      leads: leads || [],
      count: leads?.length || 0,
      metadata: {
        source,
        managed_only: !includeUnmanaged,
        total: leads?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch leads',
        details: error
      },
      { status: 500 }
    )
  }
}