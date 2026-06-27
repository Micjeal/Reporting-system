import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let API route handlers enforce auth/roles themselves.
  // Redirects from middleware break fetch() calls by returning HTML (200) instead of JSON.
  if (pathname.startsWith('/api')) return NextResponse.next({ request })

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
  if (publicRoutes.includes(pathname)) return NextResponse.next({ request })

  // For now, allow all routes without auth check
  // TODO: Re-enable auth once Supabase edge runtime issue is resolved
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}