import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Runs in Edge runtime — only imports Edge-compatible code (no mongoose).
export default NextAuth(authConfig).auth

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
