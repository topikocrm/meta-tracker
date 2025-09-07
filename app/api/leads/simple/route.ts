import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// GET - Simple fetch of leads without any joins
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '1000')
    const source = searchParams.get('source')
    
    let query = supabase
      .from('leads')
      .select(`
        *,
        assigned_user:users!assigned_to(id, name, email)
      `)
      .order('created_time', { ascending: false })
      .limit(limit)
    
    if (source) {
      query = query.eq('sheet_source', source)
    }
    
    const { data: leads, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      leads: leads || [],
      count: leads?.length || 0
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