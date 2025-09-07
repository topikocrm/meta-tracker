import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Allow access to home page and demo without authentication
  if (request.nextUrl.pathname === '/' || 
      request.nextUrl.pathname === '/demo' ||
      request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Skip Supabase check if environment variables are not set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here' ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
    
    // Redirect to demo if trying to access protected routes without proper setup
    if (request.nextUrl.pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/demo', request.url))
    }
    
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // If user is not signed in and trying to access protected routes
    if (!user && request.nextUrl.pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If user is signed in and trying to access auth pages
    if (user && request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    // If there's an error with Supabase, redirect to demo
    if (request.nextUrl.pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/demo', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}