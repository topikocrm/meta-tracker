import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Fix sync metadata to reflect all current leads as synced
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Get the highest row numbers from existing leads
    const { data: foodLeads } = await supabase
      .from('leads')
      .select('row_number')
      .eq('sheet_source', 'sheet_1_food')
      .order('row_number', { ascending: false })
      .limit(1)
    
    const { data: boutiqueLeads } = await supabase
      .from('leads')
      .select('row_number')
      .eq('sheet_source', 'sheet_2_boutique')
      .order('row_number', { ascending: false })
      .limit(1)
    
    // Get actual counts
    const { count: foodCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_source', 'sheet_1_food')
    
    const { count: boutiqueCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_source', 'sheet_2_boutique')
    
    // Update sync metadata for Food sheet
    const foodMaxRow = foodLeads?.[0]?.row_number || foodCount || 435
    await supabase
      .from('sync_metadata')
      .upsert({
        sheet_id: '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo',
        sheet_name: 'Food Leads',
        last_row_number: foodMaxRow,
        total_rows_processed: foodCount || 435,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'sheet_id'
      })
    
    // Update sync metadata for Boutique sheet
    const boutiqueMaxRow = boutiqueLeads?.[0]?.row_number || boutiqueCount || 159
    await supabase
      .from('sync_metadata')
      .upsert({
        sheet_id: '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0',
        sheet_name: 'Boutique Leads',
        last_row_number: boutiqueMaxRow,
        total_rows_processed: boutiqueCount || 159,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'sheet_id'
      })
    
    // Verify the update
    const { data: metadata } = await supabase
      .from('sync_metadata')
      .select('*')
    
    return NextResponse.json({
      success: true,
      message: 'Sync metadata fixed successfully',
      metadata,
      stats: {
        food: {
          count: foodCount,
          lastRow: foodMaxRow
        },
        boutique: {
          count: boutiqueCount,
          lastRow: boutiqueMaxRow
        }
      }
    })
    
  } catch (error) {
    console.error('Failed to fix sync metadata:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fix metadata' 
      },
      { status: 500 }
    )
  }
}