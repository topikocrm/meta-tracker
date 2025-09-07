import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Reset sync metadata to re-import leads
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    
    const { sheetId, resetToRow = 0 } = body
    
    if (sheetId) {
      // Reset specific sheet
      const { error } = await supabase
        .from('sync_metadata')
        .update({
          last_row_number: resetToRow,
          last_sync_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('sheet_id', sheetId)
      
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        message: `Reset sync metadata for sheet ${sheetId} to row ${resetToRow}`
      })
    } else {
      // Reset all sheets
      const { error } = await supabase
        .from('sync_metadata')
        .update({
          last_row_number: resetToRow,
          last_sync_at: null,
          updated_at: new Date().toISOString()
        })
        .in('sheet_id', [
          '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo',
          '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0'
        ])
      
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        message: `Reset all sync metadata to row ${resetToRow}`
      })
    }
    
  } catch (error) {
    console.error('Failed to reset sync metadata:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reset sync metadata' 
      },
      { status: 500 }
    )
  }
}

// GET - Get current sync metadata status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    const { data: metadata, error } = await supabase
      .from('sync_metadata')
      .select('*')
      .in('sheet_id', [
        '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo',
        '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0'
      ])
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      metadata: metadata || []
    })
    
  } catch (error) {
    console.error('Failed to get sync metadata:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get sync metadata' 
      },
      { status: 500 }
    )
  }
}