import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request })
    const { pathname } = request.nextUrl

    // Let API route handlers enforce auth/roles themselves.
    // Redirects from middleware break fetch() calls by returning HTML (200) instead of JSON.
    if (pathname.startsWith('/api')) return supabaseResponse

    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Middleware] Missing Supabase environment variables', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      })
      // Allow public routes to proceed without auth check
      const publicRoutes = [
        '/',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/pending-approval',
        '/unauthorized',
      ]
      if (publicRoutes.includes(pathname)) return supabaseResponse
      // For protected routes, redirect to login with a note
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet: any[]) => {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    let user = null
    try {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser()
      user = fetchedUser
    } catch (error) {
      console.error('[Middleware] Error fetching user:', error)
      user = null
    }

    // Public routes — allow without authentication
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/pending-approval',
      '/unauthorized',
    ]
    if (publicRoutes.includes(pathname)) return supabaseResponse

    // Require authentication for all other routes
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    return supabaseResponse
  } catch (error) {
    console.error('[Middleware] Unhandled error:', error)
    // Return a basic response to avoid 500 errors
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}