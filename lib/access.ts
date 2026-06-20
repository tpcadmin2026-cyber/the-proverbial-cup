// Role definitions and access control helpers.

export type UserRole = 'master_admin' | 'admin' | 'manager' | 'employee' | 'subscriber' | 'customer'

// Roles that can access the admin dashboard at all
export const TEAM_ROLES: UserRole[] = ['master_admin', 'admin', 'manager', 'employee']

// Roles with full admin access (used for quick checks where permission detail isn't needed)
export function isAdminRole(role: string): boolean {
  return TEAM_ROLES.includes(role as UserRole)
}

export function isMasterAdmin(role: string): boolean {
  return role === 'master_admin'
}

export const ROLE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  master_admin: {
    label:       'Master Admin',
    description: 'Full access — IT, deploy, environment variables, and all admin functions. Permissions cannot be restricted.',
    color:       'bg-[#7a1c1c] text-white',
  },
  admin: {
    label:       'Admin',
    description: 'Full operational access — content, users, subscriptions, settings, features. No IT/deploy by default.',
    color:       'bg-[#8b6914] text-white',
  },
  manager: {
    label:       'Manager',
    description: 'Day-to-day operations — content editing, order management, support, subscriber management.',
    color:       'bg-purple-600 text-white',
  },
  employee: {
    label:       'Employee',
    description: 'Frontline tasks — respond to support tickets, process orders, view and draft content.',
    color:       'bg-blue-600 text-white',
  },
  subscriber: {
    label:       'Subscriber',
    description: 'Active subscription member. Access to subscriber-only site content.',
    color:       'bg-green-100 text-green-700',
  },
  customer: {
    label:       'Customer',
    description: 'One-off purchaser. No subscription.',
    color:       'bg-gray-100 text-gray-600',
  },
}

// Roles available as invite options
export const INVITABLE_ROLES = ['admin', 'master_admin', 'manager', 'employee'] as const

// Roles that can have their permissions customised (master_admin is always unrestricted)
export const CONFIGURABLE_ROLES = ['admin', 'manager', 'employee'] as const
