import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// GET - Fetch notes for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabase()
    
    const { data: notes, error } = await supabase
      .from('lead_notes')
      .select(`
        *,
        user:users!created_by(id, name, email)
      `)
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      notes: notes || []
    })
    
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch notes' 
      },
      { status: 500 }
    )
  }
}

// POST - Add a note to a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabase()
    const body = await request.json()
    const { note, created_by } = body
    
    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note content is required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('lead_notes')
      .insert([{
        lead_id: id,
        note,
        created_by: created_by || null,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        user:users!created_by(id, name, email)
      `)
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      note: data,
      message: 'Note added successfully'
    })
    
  } catch (error) {
    console.error('Failed to add note:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add note' 
      },
      { status: 500 }
    )
  }
}