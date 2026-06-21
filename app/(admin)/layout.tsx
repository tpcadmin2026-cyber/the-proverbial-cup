export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { AdminNav } from '@/components/admin/AdminNav'
import { isAdminRole } from '@/lib/access'
import { getSetting } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const name = await getSetting<string>('site.name', 'My Site')
  return {
    title: { template: `%s | ${name}`, default: name },
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value

  if (!token) redirect('/login')

  const [session, siteName] = await Promise.all([
    db.session.findUnique({ where: { sessionToken: token }, include: { user: true } }),
    getSetting<string>('site.name', 'My Site'),
  ])

  if (!session || session.expires < new Date()) redirect('/login')
  if (!isAdminRole(session.user.role)) redirect('/')

  return (
    <div className="admin-layout flex min-h-screen bg-[#f8f7f4]">
      {/* DEBUG — remove after confirming role */}
      <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 9999, background: '#333', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 4, opacity: 0.85 }}>
        role: {session.user.role ?? 'undefined'}
      </div>
      <AdminNav role={session.user.role} siteName={siteName} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
