'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import pkg from '../../package.json'

interface Child {
  href:        string
  label:       string
  masterOnly?: boolean
  adminOnly?:  boolean
}

interface NavItem {
  href:        string
  label:       string
  icon:        string
  masterOnly?: boolean
  adminOnly?:  boolean
  children?:   Child[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',               label: 'Overview',      icon: '◈' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/admin/features',      label: 'Features',      icon: '⚙' },
  {
    href: '/admin/users', label: 'Users', icon: '◉',
    children: [
      { href: '/admin/users',             label: 'All users' },
      { href: '/admin/users/invitations', label: 'Invitations' },
      { href: '/admin/permissions',       label: 'Permissions' },
    ],
  },
  {
    href: '/admin/subscriptions', label: 'Subscriptions', icon: '✦',
    children: [
      { href: '/admin/subscriptions/plans',        label: 'Plans' },
      { href: '/admin/subscriptions/pause-cancel', label: 'Pause & cancel' },
    ],
  },
  {
    href: '/admin/content', label: 'Content', icon: '❧',
    children: [
      { href: '/admin/content/pages',        label: 'Pages' },
      { href: '/admin/content/blog',         label: 'Blog' },
      { href: '/admin/content/reading-room', label: 'Reading Room' },
      { href: '/admin/navigation',           label: 'Navigation' },
      { href: '/admin/media',                label: 'Media library' },
    ],
  },
  {
    href: '/admin/store', label: 'Store', icon: '⊡',
    children: [
      { href: '/admin/store/products', label: 'Products' },
      { href: '/admin/store/orders',   label: 'Orders' },
    ],
  },
  {
    href: '/admin/support', label: 'Support', icon: '✉',
    children: [
      { href: '/admin/support/tickets', label: 'Tickets' },
      { href: '/admin/support/chat',    label: 'Chat logs' },
    ],
  },
  { href: '/admin/newsletter', label: 'Newsletter',    icon: '◎' },
  { href: '/admin/waitlist',   label: 'Waitlist',      icon: '◉' },
  { href: '/admin/quiz',       label: 'Quiz',          icon: '?' },
  { href: '/admin/preview/emails', label: 'Email previews', icon: '✉' },
  {
    href: '/admin/settings', label: 'Settings', icon: '≡',
    children: [
      { href: '/admin/settings/site',        label: 'Site & branding' },
      { href: '/admin/settings/design',      label: 'Design' },
      { href: '/admin/settings/masthead',    label: 'Masthead' },
      { href: '/admin/settings/email',       label: 'Email' },
      { href: '/admin/settings/payments',    label: 'Payments' },
      { href: '/admin/settings/accounts',    label: 'User accounts' },
      { href: '/admin/settings/ai',          label: 'AI assistant' },
      { href: '/admin/settings/analytics',   label: 'Analytics' },
      { href: '/admin/settings/legal',        label: 'Legal' },
      { href: '/admin/settings/maintenance', label: 'Maintenance' },
      { href: '/admin/settings/changelog',   label: 'Changelog' },
      { href: '/admin/settings/system',      label: 'System',           adminOnly: true },
      { href: '/admin/settings/connections', label: 'Connections',      masterOnly: true },
      { href: '/admin/settings/deploy',      label: 'Deploy & backups', masterOnly: true },
      { href: '/admin/settings/templates',   label: 'Templates',        masterOnly: true },
    ],
  },
  {
    href: '/admin/help', label: 'Help centre', icon: '?',
    children: [
      { href: '/admin/help/knowledge-base',   label: 'Knowledge base' },
      { href: '/admin/help/feature-requests', label: 'Feature requests' },
    ],
  },
]

export function AdminNav({ role, siteName = 'My Site' }: { role?: string; siteName?: string }) {
  const pathname = usePathname()
  const isMaster = role === 'master_admin'
  const isAdmin  = role === 'master_admin' || role === 'admin'

  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)

  // Refresh the unread notification count whenever the admin navigates
  useEffect(() => {
    fetch('/api/admin/notifications/unread-count')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setUnreadTotal(data.total) })
      .catch(() => {})
  }, [pathname])

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const open = new Set<string>()
    for (const item of NAV_ITEMS) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        open.add(item.href)
      }
    }
    return open
  })

  // Read collapsed state from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('admin-nav-collapsed')
    if (saved === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem('admin-nav-collapsed', String(collapsed))
  }, [collapsed, mounted])

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      for (const item of NAV_ITEMS) {
        if (item.children?.some((c) => pathname.startsWith(c.href))) {
          next.add(item.href)
        }
      }
      return next
    })
  }, [pathname])

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(href) ? next.delete(href) : next.add(href)
      return next
    })
  }

  const roleLabel: Record<string, string> = {
    master_admin: 'Master Admin', admin: 'Admin',
    manager: 'Manager', employee: 'Employee',
  }
  const roleColor: Record<string, string> = {
    master_admin: 'bg-[#7A564C] text-white', admin: 'bg-[#C4AB77] text-white',
    manager: 'bg-purple-600 text-white',      employee: 'bg-blue-600 text-white',
  }

  return (
    <nav className={clsx(
      'min-h-screen bg-[#35291C] text-[#E8E6D8] flex flex-col flex-shrink-0 transition-all duration-200',
      collapsed ? 'w-14' : 'w-64'
    )}>
      {/* Header */}
      <div className={clsx(
        'border-b border-[#4B4C44]/40 flex items-start justify-between',
        collapsed ? 'px-2 py-4 flex-col items-center gap-3' : 'px-5 py-5'
      )}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-[#C4AB77] font-semibold mb-1">Admin</div>
            <div className="text-sm font-medium text-[#E8E6D8] leading-snug truncate">{siteName}</div>
            {role && roleLabel[role] && (
              <div className={`mt-2 inline-block text-xs px-2 py-0.5 rounded font-medium ${roleColor[role] ?? ''}`}>
                {roleLabel[role]}
              </div>
            )}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-[#4B4C44]/40 text-[#b8b090] hover:text-[#E8E6D8] transition-colors"
        >
          <svg
            className={clsx('w-4 h-4 transition-transform duration-200', collapsed && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <ul className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          if (item.masterOnly && !isMaster) return null
          if (item.adminOnly  && !isAdmin)  return null

          if (item.children) {
            const visibleChildren = item.children.filter((c) =>
              (!c.masterOnly || isMaster) && (!c.adminOnly || isAdmin)
            )
            if (visibleChildren.length === 0) return null
            const isOpen = openGroups.has(item.href) && !collapsed
            const hasActiveChild = visibleChildren.some((c) => pathname.startsWith(c.href))

            return (
              <li key={item.href}>
                <button
                  onClick={() => collapsed ? setCollapsed(false) : toggleGroup(item.href)}
                  title={collapsed ? item.label : undefined}
                  className={clsx(
                    'w-full flex items-center gap-3 px-2 py-2.5 rounded text-sm transition-colors',
                    hasActiveChild
                      ? 'text-[#E8E6D8] font-semibold'
                      : 'text-[#b8b090] hover:bg-[#4B4C44]/30 hover:text-[#E8E6D8]',
                    collapsed && 'justify-center'
                  )}
                >
                  <span className="w-4 text-center opacity-80 flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <svg
                        className={clsx('w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 opacity-50', isOpen && 'rotate-180')}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {!collapsed && (
                  <div className={clsx(
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  )}>
                    <ul className="ml-7 mt-0.5 mb-1 space-y-0.5">
                      {visibleChildren.map((child) => {
                        const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={clsx(
                                'flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors',
                                childActive
                                  ? 'bg-[#C4AB77] text-[#35291C] font-semibold'
                                  : 'text-[#b8b090] hover:bg-[#4B4C44]/30 hover:text-[#E8E6D8]'
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 flex-shrink-0" />
                              {child.label}
                              {child.masterOnly && (
                                <span className="ml-auto text-xs text-[#7A564C] opacity-70">IT</span>
                              )}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </li>
            )
          }

          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={clsx(
                  'flex items-center gap-3 px-2 py-2.5 rounded text-sm transition-colors',
                  active
                    ? 'bg-[#C4AB77] text-[#35291C] font-semibold'
                    : 'text-[#b8b090] hover:bg-[#4B4C44]/30 hover:text-[#E8E6D8]',
                  collapsed && 'justify-center'
                )}
              >
                <span className="w-4 text-center opacity-80 flex-shrink-0 relative">
                  {item.icon}
                  {item.href === '/admin/notifications' && unreadTotal > 0 && collapsed && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-[#C4AB77]" />
                  )}
                </span>
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.label}
                    {item.href === '/admin/notifications' && unreadTotal > 0 && (
                      <span className="text-xs bg-[#C4AB77] text-white rounded-full px-2 py-0.5">{unreadTotal}</span>
                    )}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Footer */}
      <div className={clsx(
        'border-t border-[#4B4C44]/40 space-y-1',
        collapsed ? 'px-2 py-3' : 'px-4 py-4'
      )}>
        {!collapsed && (
          <div className="text-xs text-[#C4AB77] px-2 pb-1">
            Gazette v{pkg.version}
          </div>
        )}
        {collapsed && (
          <div className="text-xs text-[#C4AB77] text-center pb-1 font-mono">
            v{pkg.version}
          </div>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            title={collapsed ? 'Sign out' : undefined}
            className={clsx(
              'w-full flex items-center gap-2 px-2 py-2 rounded text-xs text-[#b8b090] hover:bg-[#4B4C44]/30 hover:text-[#E8E6D8] transition-colors',
              collapsed && 'justify-center'
            )}
          >
            <span className="flex-shrink-0">⎋</span>
            {!collapsed && 'Sign out'}
          </button>
        </form>
      </div>
    </nav>
  )
}
