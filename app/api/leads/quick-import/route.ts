import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Import a single lead when user takes action
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    
    const { 
      lead, 
      assignTo, 
      initialStatus = 'new',
      initialNote 
    } = body
    
    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead data is required' },
        { status: 400 }
      )
    }
    
    // Prepare lead data for database
    const leadData: any = {
      // Use phone number in ID to prevent duplicates when same lead is imported multiple times
      google_sheet_id: `${lead._sheetSource}_${lead.phone_number?.replace(/\D/g, '') || lead._rowNumber}`,
      sheet_source: lead._sheetSource,
      row_number: lead._rowNumber,
      is_managed: true, // Mark as managed since user is taking action
      current_status: initialStatus,
      assigned_to: assignTo || null,
      
      // Lead information from sheets
      created_time: lead.created_time,
      full_name: lead.full_name,
      phone_number: lead.phone_number,
      whatsapp_number: lead.phone_number, // Use same as phone
      email: lead.email,
      state: lead.state,
      
      // Store additional fields as JSON
      tool_requirement: JSON.stringify({
        category: lead.category,
        business_type: lead.business_type,
        ...lead._allFields
      })
    }
    
    // Check if lead already exists (in case of race condition)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('google_sheet_id', leadData.google_sheet_id)
      .single()
    
    let savedLead
    
    if (existingLead) {
      // Update existing lead
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...leadData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id)
        .select(`
          *,
          assigned_user:users!assigned_to(id, name, email)
        `)
        .single()
      
      if (error) throw error
      savedLead = data
    } else {
      // Insert new lead
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select(`
          *,
          assigned_user:users!assigned_to(id, name, email)
        `)
        .single()
      
      if (error) throw error
      savedLead = data
      
      // Add initial note if provided
      if (initialNote && savedLead) {
        await supabase
          .from('lead_notes')
          .insert([{
            lead_id: savedLead.id,
            note: initialNote,
            created_by: assignTo || null
          }])
      }
      
      // Add status history entry
      if (savedLead) {
        await supabase
          .from('lead_status_history')
          .insert([{
            lead_id: savedLead.id,
            new_status: initialStatus,
            changed_by: assignTo || null
          }])
      }
    }
    
    // Update sync metadata to track this row as processed
    if (lead._sheetId && lead._rowNumber) {
      const { data: currentMetadata } = await supabase
        .from('sync_metadata')
        .select('last_row_number, total_rows_processed')
        .eq('sheet_id', lead._sheetId)
        .single()
      
      // Only update if this row is higher than current last_row_number
      if (!currentMetadata || lead._rowNumber > currentMetadata.last_row_number) {
        await supabase
          .from('sync_metadata')
          .upsert({
            sheet_id: lead._sheetId,
            sheet_name: lead._sheetName,
            last_row_number: lead._rowNumber,
            last_sync_at: new Date().toISOString(),
            total_rows_processed: (currentMetadata?.total_rows_processed || 0) + 1
          }, {
            onConflict: 'sheet_id'
          })
      }
    }
    
    return NextResponse.json({
      success: true,
      lead: savedLead,
      message: 'Lead imported and ready for management'
    })
    
  } catch (error) {
    console.error('Failed to import lead:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to import lead' 
      },
      { status: 500 }
    )
  }
}