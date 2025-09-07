import { createServiceClient } from './supabase/server'
import { GoogleSheetsSync, LeadData } from './google-sheets'

export interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsAdded: number
  recordsUpdated: number
  errors: string[]
}

export class LeadSyncService {
  private supabase: any
  private sheetsSync: GoogleSheetsSync

  constructor(sheetId: string) {
    this.sheetsSync = new GoogleSheetsSync(sheetId)
  }

  async initialize() {
    this.supabase = await createServiceClient()
  }

  /**
   * Sync leads from Google Sheets to Supabase
   */
  async syncLeads(sheetName?: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsAdded: 0,
      recordsUpdated: 0,
      errors: []
    }

    try {
      // Initialize Supabase client
      await this.initialize()

      // Fetch data from Google Sheets
      console.log('Fetching data from Google Sheets...')
      const sheetData = await this.sheetsSync.fetchSheetDataAsCSV(sheetName)
      result.recordsProcessed = sheetData.length

      if (sheetData.length === 0) {
        console.log('No data found in sheet')
        result.success = true
        return result
      }

      // Process each lead
      for (const rawLead of sheetData) {
        try {
          await this.processLead(rawLead, result, sheetName)
        } catch (error) {
          console.error('Error processing lead:', error)
          result.errors.push(`Failed to process lead ${rawLead.id}: ${error}`)
        }
      }

      // Log sync operation
      await this.logSyncOperation(result, sheetName)

      result.success = result.errors.length === 0
      return result
    } catch (error) {
      console.error('Sync error:', error)
      result.errors.push(`Sync failed: ${error}`)
      return result
    }
  }

  /**
   * Process individual lead
   */
  private async processLead(rawLead: LeadData, result: SyncResult, sheetSource?: string) {
    // Transform data
    const leadData = {
      ...this.sheetsSync.transformLeadData(rawLead),
      sheet_source: sheetSource || 'default'
    }

    // Check if lead exists
    const { data: existingLead, error: checkError } = await this.supabase
      .from('leads')
      .select('id, updated_at')
      .eq('google_sheet_id', leadData.google_sheet_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      throw checkError
    }

    if (existingLead) {
      // Update existing lead only if data has changed
      const { error: updateError } = await this.supabase
        .from('leads')
        .update({
          ...leadData,
          updated_at: new Date()
        })
        .eq('id', existingLead.id)

      if (updateError) {
        throw updateError
      }
      result.recordsUpdated++
    } else {
      // Insert new lead
      const { error: insertError } = await this.supabase
        .from('leads')
        .insert([leadData])

      if (insertError) {
        throw insertError
      }
      result.recordsAdded++
    }
  }

  /**
   * Log sync operation to database
   */
  private async logSyncOperation(result: SyncResult, sheetName?: string) {
    try {
      await this.supabase
        .from('sync_logs')
        .insert([{
          sheet_name: sheetName || 'default',
          sync_type: 'scheduled',
          records_processed: result.recordsProcessed,
          records_added: result.recordsAdded,
          records_updated: result.recordsUpdated,
          status: result.success ? 'success' : 'failed',
          error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
          started_at: new Date(),
          completed_at: new Date()
        }])
    } catch (error) {
      console.error('Failed to log sync operation:', error)
    }
  }
}

/**
 * Sync multiple sheets
 */
export async function syncAllSheets(sheetConfigs: { id: string, name: string }[]): Promise<SyncResult> {
  const overallResult: SyncResult = {
    success: true,
    recordsProcessed: 0,
    recordsAdded: 0,
    recordsUpdated: 0,
    errors: []
  }

  for (const config of sheetConfigs) {
    try {
      const syncService = new LeadSyncService(config.id)
      const result = await syncService.syncLeads(config.name)
      
      // Aggregate results
      overallResult.recordsProcessed += result.recordsProcessed
      overallResult.recordsAdded += result.recordsAdded
      overallResult.recordsUpdated += result.recordsUpdated
      overallResult.errors.push(...result.errors)
      
      if (!result.success) {
        overallResult.success = false
      }
    } catch (error) {
      console.error(`Failed to sync sheet ${config.name}:`, error)
      overallResult.errors.push(`Sheet ${config.name}: ${error}`)
      overallResult.success = false
    }
  }

  return overallResult
}