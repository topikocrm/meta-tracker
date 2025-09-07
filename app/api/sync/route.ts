import { NextRequest, NextResponse } from 'next/server'
import { LeadSyncService, syncAllSheets } from '@/lib/sync-service'

// GET endpoint for manual sync
export async function GET(request: NextRequest) {
  try {
    // Get sheet configurations from environment
    const sheets = getSheetConfigs()
    
    if (sheets.length === 0) {
      return NextResponse.json({
        error: 'No Google Sheets configured'
      }, { status: 400 })
    }

    // Perform sync
    console.log(`Starting sync for ${sheets.length} sheets...`)
    const result = await syncAllSheets(sheets)

    return NextResponse.json({
      success: result.success,
      message: `Sync completed: ${result.recordsAdded} added, ${result.recordsUpdated} updated`,
      details: result
    })
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint for webhook-based sync (if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sheetId, sheetName } = body

    if (!sheetId) {
      return NextResponse.json({
        error: 'Sheet ID is required'
      }, { status: 400 })
    }

    const syncService = new LeadSyncService(sheetId)
    const result = await syncService.syncLeads(sheetName)

    return NextResponse.json({
      success: result.success,
      message: `Sync completed: ${result.recordsAdded} added, ${result.recordsUpdated} updated`,
      details: result
    })
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to get sheet configurations from environment
function getSheetConfigs() {
  const configs = []
  
  // Primary sheet
  if (process.env.GOOGLE_SHEET_ID) {
    configs.push({
      id: process.env.GOOGLE_SHEET_ID,
      name: 'Primary Campaign'
    })
  }
  
  // Additional sheets (up to 5)
  for (let i = 2; i <= 5; i++) {
    const sheetId = process.env[`GOOGLE_SHEET_ID_${i}`]
    if (sheetId) {
      configs.push({
        id: sheetId,
        name: `Campaign ${i}`
      })
    }
  }
  
  return configs
}