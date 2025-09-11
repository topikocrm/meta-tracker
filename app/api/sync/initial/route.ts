import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Helper function to parse CSV line
const parseCSVLine = (line: string): string[] => {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

// POST - Initial sync to import all existing leads
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Google Sheets configuration
    const sheets = [
      { 
        id: process.env.GOOGLE_SHEET_ID || '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo',
        name: 'Food Leads',
        source: 'sheet_1_food'
      },
      { 
        id: process.env.GOOGLE_SHEET_ID_2 || '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0',
        name: 'Boutique Leads',
        source: 'sheet_2_boutique'
      },
      { 
        id: process.env.GOOGLE_SHEET_ID_3 || '1hhkIv4SP_CmP9KRusCd3oaDF9dmhIWwCGZx98wCXTM0',
        name: 'Services Leads',
        source: 'sheet_3_services'
      }
    ]

    const syncResults = []
    
    for (const sheet of sheets) {
      const startTime = new Date()
      let recordsProcessed = 0
      let recordsAdded = 0
      let recordsUpdated = 0
      let highestRowNumber = 0
      
      try {
        // Fetch CSV data from Google Sheets
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=0`
        const response = await fetch(csvUrl)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sheet: ${response.status}`)
        }
        
        const csvText = await response.text()
        
        // Parse CSV data
        const allLines = csvText.split(/\r?\n/)
        const lines = allLines.filter(line => line.length > 0)
        
        if (lines.length === 0) {
          throw new Error('No data in sheet')
        }
        
        // Parse header row
        const headers = parseCSVLine(lines[0])
        
        // Parse data rows
        const rows = []
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          
          // Check if row has any actual data
          const hasData = values.some(v => v && v.trim() !== '')
          if (!hasData) continue
          
          // Accept rows with slightly fewer columns
          const columnDifference = headers.length - values.length
          
          if (values.length === headers.length) {
            rows.push({ values, rowNumber: i })
          } else if (columnDifference > 0 && columnDifference <= 2) {
            // Pad the row with empty strings
            const paddedValues = [...values]
            for (let j = 0; j < columnDifference; j++) {
              paddedValues.push('')
            }
            rows.push({ values: paddedValues, rowNumber: i })
          }
        }
        
        // Find column indices
        const findColumnIndex = (headers: string[], searchTerms: string[]): number => {
          return headers.findIndex(header => {
            const lowerHeader = header.toLowerCase()
            return searchTerms.some(term => lowerHeader.includes(term.toLowerCase()))
          })
        }
        
        const columnIndices = {
          created_time: findColumnIndex(headers, ['created_time', 'created time']),
          full_name: findColumnIndex(headers, ['full_name', 'full name']),
          phone_number: findColumnIndex(headers, ['phone_number', 'phone number', 'whatsapp_number', 'whatsapp number']),
          email: findColumnIndex(headers, ['email']),
          state: findColumnIndex(headers, ['state', 'please_select_your_state']),
          campaign_name: findColumnIndex(headers, ['campaign_name', 'campaign name']),
          ad_name: findColumnIndex(headers, ['ad_name', 'ad name']),
          form_name: findColumnIndex(headers, ['form_name', 'form name']),
          category: headers.findIndex(h => h.includes('మీరు_చేసే_వ్యాపారం_ఏమిటి')),
          business_type: headers.findIndex(h => h.includes('మీరు_ఏ_రకమైన_వ్యాపారం_చేస్తున్నారు')),
          call_assigned_to: findColumnIndex(headers, ['call_assigned_to', 'call assigned to', 'assigned to']),
        }
        
        // Process rows and prepare for database
        for (const { values, rowNumber } of rows) {
          recordsProcessed++
          highestRowNumber = Math.max(highestRowNumber, rowNumber)
          
          // Create a unique identifier for this row
          const google_sheet_id = `${sheet.source}_row_${rowNumber}_${values[columnIndices.created_time] || ''}`
          
          // Prepare lead data
          const leadData: any = {
            google_sheet_id,
            sheet_source: sheet.source,
            row_number: rowNumber,
            is_managed: true, // Mark as managed by default so they show in dashboards
            current_status: 'new'
          }
          
          // Map column values
          if (columnIndices.created_time >= 0) {
            const dateStr = values[columnIndices.created_time]
            if (dateStr) {
              try {
                leadData.created_time = new Date(dateStr).toISOString()
              } catch {
                leadData.created_time = dateStr
              }
            }
          }
          
          if (columnIndices.full_name >= 0) {
            leadData.full_name = values[columnIndices.full_name] || ''
          }
          
          if (columnIndices.phone_number >= 0) {
            const phone = values[columnIndices.phone_number] || ''
            leadData.phone_number = phone.replace(/^p:/, '')
            leadData.whatsapp_number = leadData.phone_number
          }
          
          if (columnIndices.email >= 0) {
            leadData.email = values[columnIndices.email] || ''
          }
          
          if (columnIndices.state >= 0) {
            leadData.state = values[columnIndices.state] || ''
          }
          
          if (columnIndices.campaign_name >= 0) {
            leadData.campaign_name = values[columnIndices.campaign_name] || ''
          }
          
          if (columnIndices.ad_name >= 0) {
            leadData.ad_name = values[columnIndices.ad_name] || ''
          }
          
          if (columnIndices.form_name >= 0) {
            leadData.form_name = values[columnIndices.form_name] || ''
          }
          
          // Store additional data
          const additionalData: any = {}
          if (columnIndices.category >= 0) {
            additionalData.category = values[columnIndices.category] || ''
          }
          if (columnIndices.business_type >= 0) {
            additionalData.business_type = values[columnIndices.business_type] || ''
          }
          if (columnIndices.call_assigned_to >= 0) {
            additionalData.call_assigned_to = values[columnIndices.call_assigned_to] || ''
          }
          
          // Store all other fields
          headers.forEach((header, index) => {
            if (index < values.length && values[index]) {
              const cleanHeader = header.replace(/[^\w\s]/g, '_').trim()
              if (!leadData[cleanHeader] && cleanHeader) {
                additionalData[cleanHeader] = values[index]
              }
            }
          })
          
          leadData.tool_requirement = JSON.stringify(additionalData)
          
          // Check if lead already exists
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id, is_managed')
            .eq('google_sheet_id', google_sheet_id)
            .single()
          
          if (existingLead) {
            // Only update if not managed (preserve CRM data for managed leads)
            if (!existingLead.is_managed) {
              const { error } = await supabase
                .from('leads')
                .update({
                  full_name: leadData.full_name,
                  phone_number: leadData.phone_number,
                  whatsapp_number: leadData.whatsapp_number,
                  email: leadData.email,
                  state: leadData.state,
                  campaign_name: leadData.campaign_name,
                  ad_name: leadData.ad_name,
                  form_name: leadData.form_name,
                  tool_requirement: leadData.tool_requirement,
                  row_number: rowNumber,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingLead.id)
              
              if (!error) recordsUpdated++
            }
          } else {
            // Insert new lead
            const { error } = await supabase
              .from('leads')
              .insert([leadData])
            
            if (!error) recordsAdded++
          }
        }
        
        // Update sync metadata with highest row number
        await supabase
          .from('sync_metadata')
          .upsert({
            sheet_id: sheet.id,
            sheet_name: sheet.name,
            last_row_number: highestRowNumber,
            last_sync_at: new Date().toISOString(),
            total_rows_processed: recordsProcessed
          }, {
            onConflict: 'sheet_id'
          })
        
        // Log sync results
        await supabase.from('sync_logs').insert([{
          sheet_id: sheet.id,
          sheet_name: sheet.name,
          sync_type: 'initial',
          records_processed: recordsProcessed,
          records_added: recordsAdded,
          records_updated: recordsUpdated,
          status: 'success',
          started_at: startTime.toISOString(),
          completed_at: new Date().toISOString()
        }])
        
        syncResults.push({
          sheet: sheet.name,
          success: true,
          processed: recordsProcessed,
          added: recordsAdded,
          updated: recordsUpdated,
          lastRow: highestRowNumber
        })
        
      } catch (error) {
        // Log error
        await supabase.from('sync_logs').insert([{
          sheet_id: sheet.id,
          sheet_name: sheet.name,
          sync_type: 'initial',
          records_processed: recordsProcessed,
          records_added: recordsAdded,
          records_updated: recordsUpdated,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          started_at: startTime.toISOString(),
          completed_at: new Date().toISOString()
        }])
        
        syncResults.push({
          sheet: sheet.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      results: syncResults,
      timestamp: new Date().toISOString(),
      message: 'Initial sync completed. Use /api/leads/check-new to find new leads.'
    })
    
  } catch (error) {
    console.error('Initial sync error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Initial sync failed' 
      },
      { status: 500 }
    )
  }
}