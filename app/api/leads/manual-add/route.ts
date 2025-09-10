import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Database configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await request.json()
    
    // Validate required fields
    if (!body.full_name || !body.phone_number) {
      return NextResponse.json(
        { success: false, error: 'Name and phone number are required' },
        { status: 400 }
      )
    }
    
    // No auto-assignment - all manually added leads default to unassigned
    let assignedUserId = null
    
    // Generate a unique ID for manually added leads
    const timestamp = Date.now()
    const phoneDigits = body.phone_number.replace(/\D/g, '')
    const uniqueId = `${body.sheet_source}_manual_${phoneDigits}_${timestamp}`
    
    // Prepare lead data
    const leadData: any = {
      google_sheet_id: uniqueId, // Unique ID to prevent duplicates
      full_name: body.full_name,
      phone_number: phoneDigits, // Already cleaned
      email: body.email || null,
      business_name: body.business_name || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      pincode: body.pincode || null,
      sheet_source: body.sheet_source,
      is_managed: true,
      lead_stage: 'new',
      lead_quality: 'warm',
      current_status: 'new',
      created_time: new Date().toISOString(),
      row_number: null,
      assigned_to: assignedUserId,
      // Store additional info in tool_requirement as JSON string
      tool_requirement: JSON.stringify({
        source: 'manual',
        added_by: 'user',
        added_at: new Date().toISOString(),
        manually_added: true
      })
    }
    
    // Insert the lead
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select('*, assigned_user:users!assigned_to(id, name, email)')
      .single()
    
    if (insertError) {
      console.error('Error inserting lead:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: insertError.message || 'Failed to add lead to database',
          details: insertError 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      lead,
      message: 'Lead added successfully'
    })
    
  } catch (error) {
    console.error('Error in manual-add API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}