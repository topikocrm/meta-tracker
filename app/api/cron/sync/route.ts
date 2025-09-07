import { NextRequest, NextResponse } from 'next/server'
import { syncAllSheets } from '@/lib/sync-service'

// This endpoint will be called by Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get sheet configurations
    const sheets = getSheetConfigs()
    
    if (sheets.length === 0) {
      console.log('No sheets configured for sync')
      return NextResponse.json({
        success: true,
        message: 'No sheets configured'
      })
    }

    // Perform sync
    console.log(`[CRON] Starting scheduled sync for ${sheets.length} sheets...`)
    const startTime = Date.now()
    const result = await syncAllSheets(sheets)
    const duration = Date.now() - startTime

    console.log(`[CRON] Sync completed in ${duration}ms:`, {
      recordsAdded: result.recordsAdded,
      recordsUpdated: result.recordsUpdated,
      errors: result.errors.length
    })

    return NextResponse.json({
      success: result.success,
      duration,
      recordsProcessed: result.recordsProcessed,
      recordsAdded: result.recordsAdded,
      recordsUpdated: result.recordsUpdated,
      errors: result.errors.length > 0 ? result.errors : undefined
    })
  } catch (error) {
    console.error('[CRON] Sync error:', error)
    return NextResponse.json({
      error: 'Cron sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getSheetConfigs() {
  const configs = []
  
  if (process.env.GOOGLE_SHEET_ID) {
    configs.push({
      id: process.env.GOOGLE_SHEET_ID,
      name: 'Primary Campaign'
    })
  }
  
  // Support multiple sheets
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