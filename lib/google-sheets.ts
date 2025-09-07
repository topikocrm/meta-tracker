import Papa from 'papaparse'

export interface LeadData {
  id: string
  created_time: string
  ad_id?: string
  ad_name?: string
  adset_id?: string
  adset_name?: string
  campaign_id?: string
  campaign_name?: string
  form_id?: string
  form_name?: string
  is_organic?: boolean
  platform?: string
  please_select_your_state?: string // State field in Telugu
  'మీరు_ఆర్డర్‌లు_పేమెంట్_డెలివరీ'?: string // Tool requirement in Telugu
  'మీ_whatsapp_నంబర్_ఏమిటి?'?: string // WhatsApp number in Telugu
  full_name?: string
  phone_number?: string
  [key: string]: any // For any additional fields
}

export class GoogleSheetsSync {
  private sheetId: string

  constructor(sheetId: string) {
    this.sheetId = sheetId
  }

  /**
   * Fetch data from public Google Sheet using CSV export
   */
  async fetchSheetDataAsCSV(sheetName: string = 'Sheet1'): Promise<LeadData[]> {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
      
      const response = await fetch(csvUrl, {
        headers: {
          'Accept': 'text/csv',
        },
        cache: 'no-cache'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch sheet: ${response.statusText}`)
      }

      const csvText = await response.text()
      
      // Parse CSV
      const result = Papa.parse<LeadData>(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Clean up header names
          return header.trim()
        },
        transform: (value) => {
          // Clean up values
          if (typeof value === 'string') {
            return value.trim()
          }
          return value
        }
      })

      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors)
      }

      return result.data
    } catch (error) {
      console.error('Error fetching Google Sheet:', error)
      throw error
    }
  }

  /**
   * Alternative: Fetch using Google Sheets API (requires API key)
   */
  async fetchSheetDataViaAPI(apiKey: string, range: string = 'Sheet1!A:Z'): Promise<LeadData[]> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${range}?key=${apiKey}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch sheet via API: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.values || data.values.length === 0) {
        return []
      }

      // Convert to objects
      const headers = data.values[0]
      const rows = data.values.slice(1)

      return rows.map((row: any[]) => {
        const obj: LeadData = {} as LeadData
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || ''
        })
        return obj
      })
    } catch (error) {
      console.error('Error fetching via Sheets API:', error)
      throw error
    }
  }

  /**
   * Transform Google Sheets data to match our database schema
   */
  transformLeadData(rawLead: LeadData) {
    return {
      google_sheet_id: rawLead.id,
      created_time: rawLead.created_time ? new Date(rawLead.created_time) : new Date(),
      full_name: rawLead.full_name || '',
      phone_number: rawLead.phone_number || '',
      whatsapp_number: rawLead['మీ_whatsapp_నంబర్_ఏమిటి?'] || rawLead.whatsapp_number || '',
      state: rawLead.please_select_your_state || rawLead.state || '',
      campaign_id: rawLead.campaign_id || '',
      campaign_name: rawLead.campaign_name || '',
      adset_id: rawLead.adset_id || '',
      adset_name: rawLead.adset_name || '',
      ad_id: rawLead.ad_id || '',
      ad_name: rawLead.ad_name || '',
      form_id: rawLead.form_id || '',
      form_name: rawLead.form_name || '',
      platform: rawLead.platform || '',
      is_organic: rawLead.is_organic === true || (rawLead.is_organic as any) === 'true',
      tool_requirement: rawLead['మీరు_ఆర్డర్‌లు_పేమెంట్_డెలివరీ'] || rawLead.tool_requirement || '',
      current_status: 'new' as const,
    }
  }
}

/**
 * Sync multiple Google Sheets
 */
export async function syncMultipleSheets(sheetConfigs: { id: string, name: string }[]) {
  const allLeads: LeadData[] = []
  
  for (const config of sheetConfigs) {
    try {
      const sync = new GoogleSheetsSync(config.id)
      const leads = await sync.fetchSheetDataAsCSV()
      
      // Add source tracking
      const leadsWithSource = leads.map(lead => ({
        ...lead,
        sheet_source: config.name
      }))
      
      allLeads.push(...leadsWithSource)
    } catch (error) {
      console.error(`Error syncing sheet ${config.name}:`, error)
      // Continue with other sheets even if one fails
    }
  }
  
  return allLeads
}