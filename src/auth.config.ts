import type { NextAuthConfig } from 'next-auth'

// Edge-compatible config — no mongoose, no bcrypt, no Node-only imports.
// Used by proxy.ts (Edge middleware) and spread into lib/auth.ts (Node).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isPublicPath = ['/login', '/signup'].some((p) => pathname.startsWith(p))
      const isApiAuth = pathname.startsWith('/api/auth')

      if (isApiAuth) return true

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && isPublicPath) {
        return Response.redirect(new URL('/feeds', nextUrl))
      }

      // Block unauthenticated users — NextAuth redirects to pages.signIn
      if (!isLoggedIn && !isPublicPath) return false

      return true
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string
      return session
    },
  },
  session: { strategy: 'jwt' },
  providers: [], // Providers added in lib/auth.ts
}
