import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Mark all existing leads as managed (one-time fix)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // First, get count of unmanaged leads
    const { count: unmanagedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_managed', false)
    
    const { count: nullCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('is_managed', null)
    
    // Update all leads where is_managed is false or null
    const { data: updatedFalse, error: errorFalse } = await supabase
      .from('leads')
      .update({ 
        is_managed: true,
        updated_at: new Date().toISOString()
      })
      .eq('is_managed', false)
      .select()
    
    const { data: updatedNull, error: errorNull } = await supabase
      .from('leads')
      .update({ 
        is_managed: true,
        updated_at: new Date().toISOString()
      })
      .is('is_managed', null)
      .select()
    
    if (errorFalse || errorNull) {
      throw errorFalse || errorNull
    }
    
    const totalUpdated = (updatedFalse?.length || 0) + (updatedNull?.length || 0)
    
    // Get final counts for verification
    const { count: finalUnmanagedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .or('is_managed.eq.false,is_managed.is.null')
    
    const { count: finalManagedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_managed', true)
    
    return NextResponse.json({
      success: true,
      message: `Successfully marked ${totalUpdated} leads as managed`,
      before: {
        unmanaged_false: unmanagedCount || 0,
        unmanaged_null: nullCount || 0,
        total_unmanaged: (unmanagedCount || 0) + (nullCount || 0)
      },
      after: {
        remaining_unmanaged: finalUnmanagedCount || 0,
        total_managed: finalManagedCount || 0
      },
      updated: {
        from_false: updatedFalse?.length || 0,
        from_null: updatedNull?.length || 0,
        total: totalUpdated
      }
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

// GET - Check current managed/unmanaged counts
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Get counts by is_managed status
    const { count: managedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_managed', true)
    
    const { count: unmanagedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_managed', false)
    
    const { count: nullCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('is_managed', null)
    
    // Get counts by source and managed status
    const { data: allLeads } = await supabase
      .from('leads')
      .select('sheet_source, is_managed')
    
    const breakdown = allLeads?.reduce((acc: any, lead) => {
      const source = lead.sheet_source || 'unknown'
      const managedStatus = lead.is_managed === true ? 'managed' : 
                           lead.is_managed === false ? 'unmanaged' : 'null'
      
      if (!acc[source]) {
        acc[source] = { managed: 0, unmanaged: 0, null: 0 }
      }
      acc[source][managedStatus]++
      return acc
    }, {}) || {}
    
    return NextResponse.json({
      success: true,
      totals: {
        managed: managedCount || 0,
        unmanaged: unmanagedCount || 0,
        null: nullCount || 0,
        total: (managedCount || 0) + (unmanagedCount || 0) + (nullCount || 0)
      },
      bySource: breakdown,
      recommendation: (unmanagedCount || 0) + (nullCount || 0) > 0 
        ? `You have ${(unmanagedCount || 0) + (nullCount || 0)} unmanaged leads. Run POST to this endpoint to mark them as managed.`
        : 'All leads are already marked as managed.'
    })
    
  } catch (error) {
    console.error('Failed to get lead counts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get counts' 
      },
      { status: 500 }
    )
  }
}