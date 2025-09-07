'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, Download, Eye, EyeOff, Table, Clock, Play, Pause, Users, ShoppingBag, ArrowRight, X, Phone, Calendar, MapPin, MessageSquare, User, Info } from 'lucide-react'

interface SheetData {
  sheetName: string
  sheetId: string
  data: any[]
  error?: string
}

export default function TestSheetsPage() {
  const [sheetsData, setSheetsData] = useState<SheetData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null)
  const [showRawData, setShowRawData] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(60000) // Default 1 minute
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

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

  const testGoogleSheets = async () => {
    setIsLoading(true)
    setTestResults([])
    setSheetsData([])

    const sheets = [
      { 
        id: '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo', 
        name: 'Sheet 1',
        sheetName: 'Sheet1'
      },
      { 
        id: '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0', 
        name: 'Sheet 2',
        sheetName: 'Sheet1'
      }
    ]

    for (const sheet of sheets) {
      try {
        setTestResults(prev => [...prev, `Testing ${sheet.name}...`])
        
        // Try CSV export to get all data
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=0`
        
        console.log(`Fetching ${sheet.name} from URL:`, csvUrl)
        const response = await fetch(csvUrl)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const csvText = await response.text()
        
        // Parse CSV data - handle both \r\n and \n line endings
        const allLines = csvText.split(/\r?\n/)
        console.log(`${sheet.name} - CSV has ${allLines.length} total lines (including empty)`)
        
        // Filter out only truly empty lines (not lines with just commas)
        const lines = allLines.filter(line => line.length > 0)
        console.log(`${sheet.name} - Non-empty lines: ${lines.length}`)
        
        if (lines.length === 0) {
          throw new Error('No data in CSV')
        }
        
        // Parse header row
        const headers = parseCSVLine(lines[0])
        console.log(`${sheet.name} - Headers found:`, headers.length, 'columns')
        console.log(`${sheet.name} - Header columns:`, headers.slice(0, 10))
        
        // Parse data rows
        const rows = []
        let skippedRows = 0
        let emptyRows = 0
        let paddedRows = 0
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          
          // Check if row has any actual data (not just empty values)
          const hasData = values.some(v => v && v.trim() !== '')
          
          if (!hasData) {
            emptyRows++
            continue
          }
          
          // Accept rows that have slightly fewer columns (missing trailing empty columns)
          // Sheet 1: Accept 25-27 columns (header has 27)
          // Sheet 2: Accept 23-24 columns (header has 24)
          const columnDifference = headers.length - values.length
          
          if (values.length === headers.length) {
            rows.push(values)
          } else if (columnDifference > 0 && columnDifference <= 2) {
            // Pad the row with empty strings for missing columns
            const paddedValues = [...values]
            for (let j = 0; j < columnDifference; j++) {
              paddedValues.push('')
            }
            rows.push(paddedValues)
            paddedRows++
            if (paddedRows <= 3) {
              console.log(`${sheet.name} - Row ${i} padded: had ${values.length} columns, padded to ${headers.length}`)
            }
          } else {
            // Only skip rows with significantly different column counts
            console.log(`${sheet.name} - Row ${i} skipped: has ${values.length} values, expected ${headers.length}`)
            if (i <= 5) {
              console.log(`  Sample values:`, values.slice(0, 5))
            }
            skippedRows++
          }
        }
        
        console.log(`${sheet.name} - Parsing summary:`)
        console.log(`  Total lines: ${lines.length}`)
        console.log(`  Data rows parsed: ${rows.length}`)
        console.log(`  Empty rows: ${emptyRows}`)
        console.log(`  Padded rows: ${paddedRows}`)
        console.log(`  Skipped rows (column mismatch): ${skippedRows}`)
        
        // Find column indices for the fields we need
        let createdTimeIndex = -1
        let fullNameIndex = -1
        let phoneNumberIndex = -1
        let categoryIndex = -1
        let businessTypeIndex = -1
        
        headers.forEach((header: string, index: number) => {
          const lowerHeader = header.toLowerCase()
          
          if (lowerHeader.includes('created') && lowerHeader.includes('time')) {
            createdTimeIndex = index
          } else if (lowerHeader.includes('full') && lowerHeader.includes('name')) {
            fullNameIndex = index
          } else if (lowerHeader.includes('phone') && lowerHeader.includes('number')) {
            phoneNumberIndex = index
          } else if (header.includes('మీరు_చేసే_వ్యాపారం_ఏమిటి')) {
            categoryIndex = index
          } else if (header.includes('మీరు_ఏ_రకమైన_వ్యాపారం_చేస్తున్నారు')) {
            businessTypeIndex = index
          }
        })
        
        console.log('Column indices:', {
          createdTime: createdTimeIndex,
          fullName: fullNameIndex,
          phoneNumber: phoneNumberIndex,
          category: categoryIndex,
          businessType: businessTypeIndex
        })
        
        // Extract data from CSV rows
        const processedRows = []
        let rowsWithNoData = 0
        
        for (let i = 0; i < rows.length; i++) {
          const values = rows[i]
          
          // Store all data with field names as keys
          const rowData: any = {}
          
          // Map all headers to values
          headers.forEach((header: string, index: number) => {
            if (index < values.length) {
              // Clean up the header name for use as a key
              const cleanHeader = header.replace(/[^\w\s]/g, '_').trim()
              rowData[cleanHeader] = values[index] || ''
            }
          })
          
          // Also extract specific fields we always want to show
          rowData.created_time = ''
          rowData.full_name = ''
          rowData.phone_number = ''
          rowData.category = ''
          rowData.businessType = ''
          
          // Extract values from the row - don't require values to be truthy, just check index
          if (createdTimeIndex >= 0 && createdTimeIndex < values.length) {
            rowData.created_time = values[createdTimeIndex] || ''
          }
          
          if (fullNameIndex >= 0 && fullNameIndex < values.length) {
            rowData.full_name = values[fullNameIndex] || ''
          }
          
          if (phoneNumberIndex >= 0 && phoneNumberIndex < values.length) {
            // Clean phone number format
            const phone = values[phoneNumberIndex] || ''
            rowData.phone_number = phone.replace(/^p:/, '')
          }
          
          if (categoryIndex >= 0 && categoryIndex < values.length) {
            rowData.category = values[categoryIndex] || ''
          }
          
          if (businessTypeIndex >= 0 && businessTypeIndex < values.length) {
            rowData.businessType = values[businessTypeIndex] || ''
          }
          
          // Check if row has any actual data (not just empty strings)
          const hasData = rowData.created_time.trim() || 
                         rowData.full_name.trim() || 
                         rowData.phone_number.trim() || 
                         rowData.category.trim() || 
                         rowData.businessType.trim()
          
          if (hasData) {
            processedRows.push(rowData)
          } else {
            rowsWithNoData++
          }
        }
        
        console.log(`${sheet.name} - Rows with no relevant data: ${rowsWithNoData}`)
        
        // Sort by created_time in descending order (newest first)
        processedRows.sort((a, b) => {
          if (!a.created_time || !b.created_time) return 0
          try {
            const dateA = new Date(a.created_time)
            const dateB = new Date(b.created_time)
            return dateB.getTime() - dateA.getTime() // Descending order
          } catch {
            return 0
          }
        })
        
        console.log(`${sheet.name} - Processed ${processedRows.length} rows from ${rows.length} CSV rows`)
        if (processedRows.length > 0) {
          console.log('Sample row:', processedRows[0])
          console.log(`Fields in ${sheet.name}:`, Object.keys(processedRows[0]))
        }
        
        // Don't filter out rows - keep all rows that were processed
        // The processedRows already filtered out completely empty rows
        const filteredRows = processedRows
        
        console.log(`${sheet.name} - Final summary:`)
        console.log(`  CSV rows: ${rows.length}`)
        console.log(`  Processed rows: ${processedRows.length}`)
        console.log(`  Final rows: ${filteredRows.length}`)
        
        setSheetsData(prev => [...prev, {
          sheetName: sheet.name,
          sheetId: sheet.id,
          data: filteredRows
        }])

        setTestResults(prev => [...prev, `✅ ${sheet.name}: Found ${filteredRows.length} leads`])
      } catch (error) {
        console.error(`Error with ${sheet.name}:`, error)
        setTestResults(prev => [...prev, `❌ ${sheet.name}: ${error}`])
        setSheetsData(prev => [...prev, {
          sheetName: sheet.name,
          sheetId: sheet.id,
          data: [],
          error: String(error)
        }])
      }
    }

    setIsLoading(false)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    testGoogleSheets()
  }, [])

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (!document.hidden) { // Only refresh if page is visible
        testGoogleSheets()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Pause refresh when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && autoRefresh) {
        console.log('Page hidden, pausing auto-refresh')
      } else if (!document.hidden && autoRefresh) {
        console.log('Page visible, resuming auto-refresh')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [autoRefresh])


  const exportToCSV = (data: any[], sheetName: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          return value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sheetName.replace(' ', '_')}_export.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = (data: any[], sheetName: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sheetName.replace(' ', '_')}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Google Sheets Connection Test</h1>
              <p className="text-gray-600 mt-1">Testing your actual Google Sheets data</p>
              {lastRefresh && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last refreshed: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-refresh controls */}
              <div className="flex items-center gap-2">
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30000}>30 sec</option>
                  <option value={60000}>1 min</option>
                  <option value={120000}>2 min</option>
                  <option value={300000}>5 min</option>
                </select>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    autoRefresh 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {autoRefresh ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Auto-refresh ON
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Auto-refresh OFF
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={testGoogleSheets}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Now
              </button>
            </div>
          </div>

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-700">
                  Auto-refresh is active - refreshing every {refreshInterval / 1000} seconds
                </span>
              </div>
              {isLoading && <span className="text-xs text-green-600">Refreshing...</span>}
            </div>
          )}

          {/* Test Results */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Connection Status</h3>
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm">
                  {result.includes('✅') ? (
                    <span className="text-green-600">{result}</span>
                  ) : result.includes('❌') ? (
                    <span className="text-red-600">{result}</span>
                  ) : (
                    <span className="text-gray-600">{result}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lead Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Food Leads Card */}
            <div 
              className={`cursor-pointer border-2 rounded-xl p-6 transition-all ${
                selectedSheet === 0 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedSheet(selectedSheet === 0 ? null : 0)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ShoppingBag className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Food Leads</h3>
                    <p className="text-sm text-gray-600">Restaurant & Food Business</p>
                  </div>
                </div>
                <ArrowRight className={`h-6 w-6 text-gray-400 transition-transform ${
                  selectedSheet === 0 ? 'rotate-90' : ''
                }`} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {sheetsData[0]?.data.length || 0}
                </div>
                <span className="text-sm text-gray-500">Total Leads</span>
              </div>
              {sheetsData[0]?.data.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Latest: {new Date(sheetsData[0].data[0].created_time).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Boutique Leads Card */}
            <div 
              className={`cursor-pointer border-2 rounded-xl p-6 transition-all ${
                selectedSheet === 1 
                  ? 'border-purple-500 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedSheet(selectedSheet === 1 ? null : 1)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Boutique Leads</h3>
                    <p className="text-sm text-gray-600">Fashion & Boutique Business</p>
                  </div>
                </div>
                <ArrowRight className={`h-6 w-6 text-gray-400 transition-transform ${
                  selectedSheet === 1 ? 'rotate-90' : ''
                }`} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {sheetsData[1]?.data.length || 0}
                </div>
                <span className="text-sm text-gray-500">Total Leads</span>
              </div>
              {sheetsData[1]?.data.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Latest: {new Date(sheetsData[1].data[0].created_time).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Sheet Data */}
          {selectedSheet !== null && sheetsData[selectedSheet] && (
            <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedSheet === 0 ? 'Food Leads' : 'Boutique Leads'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    ({sheetsData[selectedSheet].data.length} records)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sheetsData[selectedSheet].data.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowRawData(!showRawData)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        {showRawData ? 
                          <><EyeOff className="h-4 w-4" /> Hide Raw</> : 
                          <><Eye className="h-4 w-4" /> Show Raw</>
                        }
                      </button>
                      <button
                        onClick={() => exportToCSV(sheetsData[selectedSheet].data, sheetsData[selectedSheet].sheetName)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        <Download className="h-4 w-4" /> CSV
                      </button>
                      <button
                        onClick={() => exportToJSON(sheetsData[selectedSheet].data, sheetsData[selectedSheet].sheetName)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-4 w-4" /> JSON
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                {sheetsData[selectedSheet].error ? (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    Error: {sheetsData[selectedSheet].error}
                  </div>
                ) : sheetsData[selectedSheet].data.length > 0 ? (
                  <>
                    {/* Formatted Table View */}
                    {!showRawData ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {/* Fixed column headers */}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Type</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sheetsData[selectedSheet].data.slice(0, 20).map((row, rowIndex) => {
                                // Format the created_time
                                const formatDate = (dateStr: any) => {
                                  if (!dateStr) return null
                                  try {
                                    const date = new Date(dateStr)
                                    if (!isNaN(date.getTime())) {
                                      const options: Intl.DateTimeFormatOptions = {
                                        weekday: 'short',
                                        month: 'short',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      }
                                      return date.toLocaleString('en-US', options)
                                    }
                                  } catch (e) {
                                    // Keep original value if parsing fails
                                  }
                                  return dateStr
                                }
                                
                                // Clean phone number (remove p: prefix if present)
                                const cleanPhoneNumber = (phone: string) => {
                                  if (!phone) return ''
                                  return phone.replace(/^p:/, '')
                                }
                                
                                return (
                                  <tr 
                                    key={rowIndex} 
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      setSelectedLead(row)
                                      setShowModal(true)
                                    }}
                                  >
                                    {/* Created Time */}
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {row.created_time ? (
                                        <div className="whitespace-nowrap">
                                          {formatDate(row.created_time) || row.created_time}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">—</span>
                                      )}
                                    </td>
                                    
                                    {/* Name */}
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {row.full_name ? (
                                        <div className="max-w-xs" title={String(row.full_name)}>
                                          {String(row.full_name)}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">—</span>
                                      )}
                                    </td>
                                    
                                    {/* Phone Number */}
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {row.phone_number ? (
                                        <div className="whitespace-nowrap font-mono text-xs">
                                          {cleanPhoneNumber(String(row.phone_number))}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">—</span>
                                      )}
                                    </td>
                                    
                                    {/* Category */}
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {row.category ? (
                                        <div className="max-w-xs truncate" title={String(row.category)}>
                                          {String(row.category)}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">—</span>
                                      )}
                                    </td>
                                    
                                    {/* Business Type */}
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {row.businessType ? (
                                        <div className="max-w-xs truncate" title={String(row.businessType)}>
                                          {String(row.businessType)}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">—</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          {sheetsData[selectedSheet].data.length > 20 && (
                            <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                              Showing first 20 of {sheetsData[selectedSheet].data.length} records
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Raw Data View */
                        <div className="space-y-4">
                          <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Table className="h-4 w-4" />
                            Raw Data View (All Fields)
                          </div>
                          <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
                            {sheetsData[selectedSheet].data.slice(0, 5).map((row, rowIndex) => (
                              <div key={rowIndex} className="border-b border-gray-200 last:border-b-0">
                                <div className="bg-gray-50 px-4 py-2 font-medium text-sm text-gray-700">
                                  Record {rowIndex + 1}
                                </div>
                                <div className="p-4 bg-white">
                                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(row).map(([key, value]) => {
                                      // Format the field name for display
                                      let displayKey = key
                                      if (key === 'created_time') displayKey = 'Created Time'
                                      else if (key === 'full_name') displayKey = 'Full Name'
                                      else if (key === 'phone_number') displayKey = 'Phone Number'
                                      else if (key === 'category') displayKey = 'Category'
                                      else if (key === 'businessType') displayKey = 'Business Type'
                                      
                                      return (
                                        <div key={key} className="flex flex-col">
                                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                            {displayKey}
                                          </dt>
                                          <dd className="text-sm text-gray-900 break-words">
                                            {value ? String(value) : <span className="text-gray-400 italic">empty</span>}
                                          </dd>
                                        </div>
                                      )
                                    })}
                                  </dl>
                                </div>
                              </div>
                            ))}
                          </div>
                          {sheetsData[selectedSheet].data.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                              Showing first 5 of {sheetsData[selectedSheet].data.length} records in raw view
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-600 rounded-lg">
                      No data found or sheet might be empty
                    </div>
                  )}

                  {/* Column Names Found */}
                  {sheetsData[selectedSheet].data.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Available Fields ({Object.keys(sheetsData[selectedSheet].data[0]).length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(sheetsData[selectedSheet].data[0]).map(col => (
                          <span key={col} className="px-2 py-1 bg-white text-xs text-blue-700 rounded border border-blue-200">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* Integration Instructions */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ Sheets Connected Successfully!</h3>
            <p className="text-sm text-green-700">
              Your Google Sheets are accessible. When you set up Supabase, the sync service will 
              automatically pull this data every 5 minutes and store it in the database.
            </p>
          </div>
        </div>
      </div>

      {/* Lead Details Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedLead(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Primary Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedLead.full_name || 'No Name'}
                    </h3>
                    <p className="text-sm text-gray-500">Lead Information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  {selectedLead.phone_number && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Phone Number</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLead.phone_number.replace(/^p:/, '')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Created Time */}
                  {selectedLead.created_time && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Created On</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedLead.created_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* State */}
                  {selectedLead.please_select_your_state && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">State</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLead.please_select_your_state}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  {selectedLead.category && (
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLead.category}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Business Type */}
                  {selectedLead.businessType && (
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Business Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLead.businessType}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              {selectedLead.comments && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Last Comment</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedLead.comments}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* All Other Fields */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">All Details</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(selectedLead).map(([key, value]) => {
                    // Skip the main fields we already displayed
                    if (['created_time', 'full_name', 'phone_number', 'category', 'businessType', 'comments', 'please_select_your_state'].includes(key)) {
                      return null
                    }
                    
                    // Skip empty values
                    if (!value || value === '') return null
                    
                    // Format the key for display
                    const displayKey = key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                    
                    return (
                      <div key={key} className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
                        <span className="text-xs font-medium text-gray-500">{displayKey}</span>
                        <span className="text-sm text-gray-900 col-span-2">{String(value)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (selectedLead.phone_number) {
                      window.open(`tel:${selectedLead.phone_number}`, '_blank')
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={!selectedLead.phone_number}
                >
                  <Phone className="h-4 w-4" />
                  Call Lead
                </button>
                <button
                  onClick={() => {
                    if (selectedLead.phone_number) {
                      const phone = selectedLead.phone_number.replace(/[^\d]/g, '')
                      window.open(`https://wa.me/${phone}`, '_blank')
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!selectedLead.phone_number}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}