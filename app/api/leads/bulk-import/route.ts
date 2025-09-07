import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Bulk import multiple leads at once
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    
    const { 
      leads = [], 
      assignToRandom = true,
      markAsManaged = true 
    } = body
    
    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No leads provided' },
        { status: 400 }
      )
    }
    
    // Get available users for random assignment
    let availableUsers: any[] = []
    if (assignToRandom) {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('is_active', true)
      
      availableUsers = users || []
    }
    
    // Prepare leads for bulk insert
    const leadsToInsert = leads.map((lead: any, index: number) => {
      const assignedUser = assignToRandom && availableUsers.length > 0
        ? availableUsers[index % availableUsers.length].id
        : null
      
      return {
        google_sheet_id: `${lead._sheetSource}_row_${lead._rowNumber}_${lead.created_time || ''}`,
        sheet_source: lead._sheetSource,
        row_number: lead._rowNumber,
        is_managed: markAsManaged,
        current_status: 'new',
        assigned_to: assignedUser,
        lead_stage: 'new',
        lead_quality: 'cold',
        contact_status: 'not_attempted',
        
        // Lead information from sheets
        created_time: lead.created_time,
        full_name: lead.full_name,
        phone_number: lead.phone_number,
        whatsapp_number: lead.phone_number,
        email: lead.email,
        state: lead.state,
        
        // Store additional fields as JSON
        tool_requirement: JSON.stringify({
          category: lead.category,
          business_type: lead.business_type,
          ...lead._allFields
        })
      }
    })
    
    // Insert leads in batches of 100
    const batchSize = 100
    let totalInserted = 0
    let totalUpdated = 0
    let errors: any[] = []
    
    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize)
      
      try {
        const { data, error } = await supabase
          .from('leads')
          .upsert(batch, {
            onConflict: 'google_sheet_id',
            ignoreDuplicates: false
          })
          .select()
        
        if (error) {
          errors.push({ batch: i / batchSize, error: error.message })
        } else {
          totalInserted += data?.length || 0
        }
      } catch (batchError) {
        errors.push({ batch: i / batchSize, error: batchError })
      }
    }
    
    // Update sync metadata for each sheet
    const sheetGroups = leads.reduce((acc: any, lead: any) => {
      if (!acc[lead._sheetId]) {
        acc[lead._sheetId] = {
          sheetId: lead._sheetId,
          sheetName: lead._sheetName,
          maxRow: lead._rowNumber,
          count: 1
        }
      } else {
        acc[lead._sheetId].maxRow = Math.max(acc[lead._sheetId].maxRow, lead._rowNumber)
        acc[lead._sheetId].count++
      }
      return acc
    }, {})
    
    for (const sheetData of Object.values(sheetGroups)) {
      const data = sheetData as any
      await supabase
        .from('sync_metadata')
        .upsert({
          sheet_id: data.sheetId,
          sheet_name: data.sheetName,
          last_row_number: data.maxRow,
          last_sync_at: new Date().toISOString(),
          total_rows_processed: data.count
        }, {
          onConflict: 'sheet_id'
        })
    }
    
    return NextResponse.json({
      success: errors.length === 0,
      message: `Imported ${totalInserted} leads`,
      totalProcessed: leadsToInsert.length,
      totalInserted,
      totalUpdated,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Failed to bulk import leads:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to bulk import leads' 
      },
      { status: 500 }
    )
  }
}