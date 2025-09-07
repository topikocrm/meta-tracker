import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Step 1: Get all unique call_assigned_to values from leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, tool_requirement')
    
    if (leadsError) throw leadsError
    
    // Extract unique assignee names
    const assigneeNames = new Set<string>()
    const leadAssignments: { leadId: string; assigneeName: string }[] = []
    
    for (const lead of leads || []) {
      if (lead.tool_requirement) {
        try {
          const data = JSON.parse(lead.tool_requirement)
          // Check for call_assigned_to field
          const assignedTo = data.call_assigned_to || data['call_assigned_to'] || data['Call Assigned To']
          
          if (assignedTo && assignedTo.trim() !== '') {
            const name = assignedTo.trim()
            assigneeNames.add(name)
            leadAssignments.push({ leadId: lead.id, assigneeName: name })
          }
        } catch (e) {
          console.error('Error parsing tool_requirement for lead', lead.id)
        }
      }
    }
    
    console.log(`Found ${assigneeNames.size} unique assignees in leads`)
    console.log('Assignee names:', Array.from(assigneeNames))
    
    // Step 2: Create users for each unique assignee
    const userMap: Record<string, string> = {} // name -> userId
    let usersCreated = 0
    let usersExisting = 0
    
    for (const name of assigneeNames) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('name', name)
        .single()
      
      if (existingUser) {
        userMap[name] = existingUser.id
        usersExisting++
      } else {
        // Create new user with default email
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            name: name,
            email: email,
            role: 'user',
            is_active: true
          })
          .select('id')
          .single()
        
        if (createError) {
          console.error(`Failed to create user ${name}:`, createError)
          // Try with a different email if duplicate
          const altEmail = `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@example.com`
          const { data: altUser } = await supabase
            .from('users')
            .insert({
              name: name,
              email: altEmail,
              role: 'user',
              is_active: true
            })
            .select('id')
            .single()
          
          if (altUser) {
            userMap[name] = altUser.id
            usersCreated++
          }
        } else if (newUser) {
          userMap[name] = newUser.id
          usersCreated++
        }
      }
    }
    
    console.log(`Created ${usersCreated} new users, ${usersExisting} already existed`)
    
    // Step 3: Update leads with assigned_to field
    let leadsUpdated = 0
    let updateErrors = 0
    
    for (const assignment of leadAssignments) {
      const userId = userMap[assignment.assigneeName]
      if (userId) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            assigned_to: userId,
            is_managed: true // Mark as managed since it has assignment
          })
          .eq('id', assignment.leadId)
        
        if (updateError) {
          console.error(`Failed to update lead ${assignment.leadId}:`, updateError)
          updateErrors++
        } else {
          leadsUpdated++
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        uniqueAssignees: assigneeNames.size,
        usersCreated,
        usersExisting,
        leadsUpdated,
        updateErrors,
        assigneeNames: Array.from(assigneeNames)
      }
    })
    
  } catch (error) {
    console.error('Sync assign users error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync assignments' 
      },
      { status: 500 }
    )
  }
}