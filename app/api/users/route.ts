import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// GET - Fetch all active users for assignment
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, location')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      users: users || []
    })
    
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users' 
      },
      { status: 500 }
    )
  }
}

// POST - Create a new user (for initial setup)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()
    
    const { email, name, phone, role = 'user', location } = body
    
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        name,
        phone,
        role,
        location,
        is_active: true
      }])
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 400 }
        )
      }
      throw error
    }
    
    return NextResponse.json({
      success: true,
      user: data,
      message: 'User created successfully'
    })
    
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      },
      { status: 500 }
    )
  }
}