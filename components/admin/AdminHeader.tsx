import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  const session = token
    ? await db.session.findUnique({ where: { sessionToken: token }, include: { user: true } })
    : null

  const user = session?.user

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action && <div>{action}</div>}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#C4AB77] border border-[#C4AB77] rounded hover:bg-[#C4AB77] hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Preview site
        </a>
        <span className="text-sm text-gray-500">{user?.email}</span>
        <div className="h-8 w-8 rounded-full bg-[#C4AB77] flex items-center justify-center text-white text-xs font-bold">
          {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  )
}
