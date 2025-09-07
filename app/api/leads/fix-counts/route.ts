import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Fix lead counts and sync metadata
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Count existing leads by source
    const { count: foodCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_source', 'sheet_1_food')
    
    const { count: boutiqueCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_source', 'sheet_2_boutique')
    
    // Get max row numbers from existing leads
    const { data: foodMaxRow } = await supabase
      .from('leads')
      .select('row_number')
      .eq('sheet_source', 'sheet_1_food')
      .order('row_number', { ascending: false })
      .limit(1)
      .single()
    
    const { data: boutiqueMaxRow } = await supabase
      .from('leads')
      .select('row_number')
      .eq('sheet_source', 'sheet_2_boutique')
      .order('row_number', { ascending: false })
      .limit(1)
      .single()
    
    // Update sync metadata to reflect actual state
    if (foodMaxRow?.row_number) {
      await supabase
        .from('sync_metadata')
        .update({
          last_row_number: foodMaxRow.row_number,
          total_rows_processed: foodCount || 0,
          last_sync_at: new Date().toISOString()
        })
        .eq('sheet_id', '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo')
    }
    
    if (boutiqueMaxRow?.row_number) {
      await supabase
        .from('sync_metadata')
        .update({
          last_row_number: boutiqueMaxRow.row_number,
          total_rows_processed: boutiqueCount || 0,
          last_sync_at: new Date().toISOString()
        })
        .eq('sheet_id', '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Fixed lead counts and sync metadata',
      stats: {
        food: {
          count: foodCount,
          maxRow: foodMaxRow?.row_number || 0
        },
        boutique: {
          count: boutiqueCount,
          maxRow: boutiqueMaxRow?.row_number || 0
        }
      }
    })
    
  } catch (error) {
    console.error('Failed to fix counts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fix counts' 
      },
      { status: 500 }
    )
  }
}