import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { db } from './db'
import { compare } from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    // Magic link via Resend
    Resend({
      from: process.env.EMAIL_FROM ?? 'noreply@gazette-platform.com',
    }),
    // Google OAuth (enabled/disabled by feature flag in admin)
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Email + password credentials
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user?.passwordHash) return null
        const valid = await compare(credentials.password as string, user.passwordHash)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        const dbUser = await db.user.findUnique({ where: { id: user.id } })
        session.user.role = dbUser?.role ?? 'subscriber'
        session.user.id   = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
})

// Require admin role — use in Server Components and Route Handlers.
const ADMIN_ROLES = new Set(['admin', 'master_admin', 'manager', 'employee'])

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    throw new Error('Unauthorised')
  }
  return session
}

export async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || !['admin', 'master_admin'].includes(session.user.role as string)) {
    throw new Error('Unauthorised')
  }
  return session
}
