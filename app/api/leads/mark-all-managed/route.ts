import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Mark all existing leads as managed
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Update ALL leads to be managed with status 'new'
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        is_managed: true,
        current_status: 'new'
      })
      .is('is_managed', null)
      .select('id')
    
    if (error) throw error
    
    // Also update any that might have is_managed = false
    const { data: data2, error: error2 } = await supabase
      .from('leads')
      .update({ 
        is_managed: true,
        current_status: 'new'
      })
      .eq('is_managed', false)
      .select('id')
    
    if (error2) throw error2
    
    // Get final counts
    const { count: totalCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
    
    const { count: managedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_managed', true)
    
    return NextResponse.json({
      success: true,
      message: `Successfully marked all leads as managed`,
      updated: (data?.length || 0) + (data2?.length || 0),
      totalLeads: totalCount,
      managedLeads: managedCount
    })
    
  } catch (error) {
    console.error('Failed to mark leads as managed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update leads' 
      },
      { status: 500 }
    )
  }
}