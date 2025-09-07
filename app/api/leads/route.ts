import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// GET - Fetch leads with CRM data
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assigned_to')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabase
      .from('leads')
      .select(`
        *,
        assigned_user:users!assigned_to(id, name, email),
        lost_reason:lost_reasons(reason, category)
      `)
      .order('created_time', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply filters
    if (status) {
      query = query.eq('current_status', status)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }
    if (source) {
      query = query.eq('sheet_source', source)
    }
    
    const { data: leads, error, count } = await query
    
    if (error) throw error
    
    // Parse tool_requirement JSON for each lead
    const processedLeads = leads?.map(lead => ({
      ...lead,
      additional_data: lead.tool_requirement ? JSON.parse(lead.tool_requirement) : {}
    })) || []
    
    return NextResponse.json({
      success: true,
      leads: processedLeads,
      count,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch leads' 
      },
      { status: 500 }
    )
  }
}

// POST - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    
    const { error } = await supabase
      .from('leads')
      .insert([body])
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Lead created successfully'
    })
    
  } catch (error) {
    console.error('Failed to create lead:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create lead' 
      },
      { status: 500 }
    )
  }
}

// PATCH - Update a lead
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      )
    }
    
    // If status is being updated, track the change
    if (updateData.current_status) {
      // Get current status
      const { data: currentLead } = await supabase
        .from('leads')
        .select('current_status')
        .eq('id', id)
        .single()
      
      if (currentLead && currentLead.current_status !== updateData.current_status) {
        // Insert status history record
        await supabase
          .from('lead_status_history')
          .insert([{
            lead_id: id,
            previous_status: currentLead.current_status,
            new_status: updateData.current_status,
            changed_by: updateData.changed_by || null,
            changed_at: new Date().toISOString()
          }])
      }
    }
    
    // Update the lead
    const { error } = await supabase
      .from('leads')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully'
    })
    
  } catch (error) {
    console.error('Failed to update lead:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update lead' 
      },
      { status: 500 }
    )
  }
}