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

// GET - Check for new leads not yet in Supabase
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // First, get count of existing leads in database
    const { count: existingFoodCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_source', 'sheet_1_food')
    
    const { count: existingBoutiqueCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_source', 'sheet_2_boutique')
    
    const { count: existingServicesCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_source', 'sheet_3_services')
    
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
        name: 'Generic Campaign-1',
        source: 'sheet_3_services'
      }
    ]

    const allNewLeads = []
    
    for (const sheet of sheets) {
      try {
        // Get last sync metadata
        const { data: metadata } = await supabase
          .from('sync_metadata')
          .select('last_row_number, last_sync_at')
          .eq('sheet_id', sheet.id)
          .single()
        
        const lastRowNumber = metadata?.last_row_number || 0
        
        // Fetch CSV data from Google Sheets
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=0`
        const response = await fetch(csvUrl)
        
        if (!response.ok) {
          console.error(`Failed to fetch sheet ${sheet.name}`)
          continue
        }
        
        const csvText = await response.text()
        
        // Parse CSV data
        const allLines = csvText.split(/\r?\n/)
        const lines = allLines.filter(line => line.length > 0)
        
        if (lines.length === 0) continue
        
        // Parse header row
        const headers = parseCSVLine(lines[0])
        
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
          phone_number: findColumnIndex(headers, ['phone_number', 'phone number', 'whatsapp_number']),
          email: findColumnIndex(headers, ['email']),
          state: findColumnIndex(headers, ['state', 'please_select_your_state']),
          category: headers.findIndex(h => h.includes('మీరు_చేసే_వ్యాపారం_ఏమిటి')),
          business_type: headers.findIndex(h => h.includes('మీరు_ఏ_రకమైన_వ్యాపారం_చేస్తున్నారు')),
        }
        
        // Process only new rows (after lastRowNumber)
        const newLeads = []
        
        for (let i = Math.max(1, lastRowNumber + 1); i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          
          // Check if row has any actual data
          const hasData = values.some(v => v && v.trim() !== '')
          if (!hasData) continue
          
          // Accept rows with slightly fewer columns
          const columnDifference = headers.length - values.length
          if (columnDifference > 2) continue
          
          // Pad if necessary
          const paddedValues = [...values]
          for (let j = 0; j < columnDifference; j++) {
            paddedValues.push('')
          }
          
          // Create lead object
          const lead: any = {
            _isNew: true,
            _rowNumber: i,
            _sheetSource: sheet.source,
            _sheetName: sheet.name,
            _sheetId: sheet.id
          }
          
          // Extract values
          if (columnIndices.created_time >= 0) {
            const dateStr = paddedValues[columnIndices.created_time]
            if (dateStr) {
              try {
                lead.created_time = new Date(dateStr).toISOString()
              } catch {
                lead.created_time = dateStr
              }
            }
          }
          
          if (columnIndices.full_name >= 0) {
            lead.full_name = paddedValues[columnIndices.full_name] || ''
          }
          
          if (columnIndices.phone_number >= 0) {
            const phone = paddedValues[columnIndices.phone_number] || ''
            lead.phone_number = phone.replace(/^p:/, '')
          }
          
          if (columnIndices.email >= 0) {
            lead.email = paddedValues[columnIndices.email] || ''
          }
          
          if (columnIndices.state >= 0) {
            lead.state = paddedValues[columnIndices.state] || ''
          }
          
          if (columnIndices.category >= 0) {
            lead.category = paddedValues[columnIndices.category] || ''
          }
          
          if (columnIndices.business_type >= 0) {
            lead.business_type = paddedValues[columnIndices.business_type] || ''
          }
          
          // Store all fields for reference
          lead._allFields = {}
          headers.forEach((header, index) => {
            if (index < paddedValues.length && paddedValues[index]) {
              const cleanHeader = header.replace(/[^\w\s]/g, '_').trim()
              lead._allFields[cleanHeader] = paddedValues[index]
            }
          })
          
          newLeads.push(lead)
        }
        
        if (newLeads.length > 0) {
          allNewLeads.push({
            sheetName: sheet.name,
            sheetId: sheet.id,
            source: sheet.source,
            newCount: newLeads.length,
            lastSyncRow: lastRowNumber,
            currentTotalRows: lines.length - 1, // Minus header
            leads: newLeads
          })
        }
        
      } catch (error) {
        console.error(`Error checking sheet ${sheet.name}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      sheetsChecked: sheets.length,
      newLeadsFound: allNewLeads.reduce((sum, s) => sum + s.newCount, 0),
      sheets: allNewLeads
    })
    
  } catch (error) {
    console.error('Failed to check for new leads:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check new leads' 
      },
      { status: 500 }
    )
  }
}