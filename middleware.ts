import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // Let API route handlers enforce auth/roles themselves.
  // Redirects from middleware break fetch() calls by returning HTML (200) instead of JSON.
  if (pathname.startsWith('/api')) return supabaseResponse

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}