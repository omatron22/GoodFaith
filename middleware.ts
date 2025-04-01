// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()
  
  // For API routes, verify authentication and attach user to request
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Extract bearer token from Authorization header if present
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    try {
      let userData
      
      if (token) {
        // Use token if provided
        const { data, error } = await supabase.auth.getUser(token)
        if (error || !data.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        userData = data.user
      } else if (session) {
        // Fall back to session if no token
        userData = session.user
      } else {
        // No authentication found
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      
      // Clone the request headers and attach the user ID
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', userData.id)
      
      // Return a new response with the modified headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      })
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }
  }
  
  return res
}

// This ensures middleware runs for auth-protected routes
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/chat/:path*',
    '/results/:path*',
    '/history/:path*',
  ],
}