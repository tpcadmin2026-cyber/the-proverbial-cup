import { NextRequest, NextResponse } from 'next/server'

// Public paths that never require a session
const PUBLIC_PATHS = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/verify-email', '/accept-invite', '/api/auth', '/setup', '/api/setup',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow public auth paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // Protect /admin — cookie presence check only (full DB check in the layout)
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('authjs.session-token')?.value
    if (!token) return NextResponse.redirect(new URL('/login', req.url))
  }

  // Forward pathname as a header so server layouts can read the current URL
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Run on all pages (not static assets or images) so x-pathname header is always set
  matcher: [
    '/admin/:path*',
    '/account',
    '/account/:path*',
    '/pricing',
    '/subscribe/:path*',
    '/shop',
    '/shop/:path*',
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/accept-invite',
    '/setup',
  ],
}
