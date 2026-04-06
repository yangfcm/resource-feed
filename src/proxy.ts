import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))
  const isApiAuth = pathname.startsWith('/api/auth')

  if (!isAuthenticated && !isPublicPath && !isApiAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/feeds', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
