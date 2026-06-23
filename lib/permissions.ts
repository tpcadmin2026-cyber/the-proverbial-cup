// Permissions system — every action in the platform is a named permission.
// Roles get a default set; admins can override per-role or per-user.

import { db } from './db'

// ── Permission keys ───────────────────────────────────────────────────────────
// Format: category.action

export const PERMISSIONS = {
  // Content management
  CONTENT_VIEW:         'content.view',
  CONTENT_CREATE:       'content.create',
  CONTENT_EDIT:         'content.edit',
  CONTENT_PUBLISH:      'content.publish',
  CONTENT_DELETE:       'content.delete',

  // User management
  USERS_VIEW:           'users.view',
  USERS_INVITE:         'users.invite',
  USERS_EDIT:           'users.edit',
  USERS_DELETE:         'users.delete',
  USERS_MANAGE_ROLES:   'users.manage_roles',
  USERS_IMPERSONATE:    'users.impersonate',

  // Subscriptions
  SUBS_VIEW:            'subscriptions.view',
  SUBS_MANAGE_PLANS:    'subscriptions.manage_plans',
  SUBS_MANAGE_MEMBERS:  'subscriptions.manage_members',
  SUBS_PAUSE:           'subscriptions.pause',
  SUBS_CANCEL:          'subscriptions.cancel',
  SUBS_REFUND:          'subscriptions.refund',

  // Store / eCommerce
  STORE_VIEW:           'store.view',
  STORE_MANAGE_PRODUCTS:'store.manage_products',
  STORE_VIEW_ORDERS:    'store.view_orders',
  STORE_MANAGE_ORDERS:  'store.manage_orders',
  STORE_REFUND:         'store.refund',

  // Support
  SUPPORT_VIEW:         'support.view',
  SUPPORT_RESPOND:      'support.respond',
  SUPPORT_CLOSE:        'support.close',
  SUPPORT_ASSIGN:       'support.assign',
  SUPPORT_DELETE:       'support.delete',

  // Help centre
  HELP_VIEW:            'help.view',
  HELP_MANAGE_KB:       'help.manage_kb',
  HELP_MANAGE_REQUESTS: 'help.manage_requests',

  // Analytics
  ANALYTICS_VIEW:       'analytics.view',
  ANALYTICS_EXPORT:     'analytics.export',

  // Changelog
  CHANGELOG_VIEW:       'changelog.view',
  CHANGELOG_CREATE:     'changelog.create',

  // Features
  FEATURES_VIEW:        'features.view',
  FEATURES_TOGGLE:      'features.toggle',

  // Settings
  SETTINGS_VIEW:        'settings.view',
  SETTINGS_EDIT:        'settings.edit',
  SETTINGS_CONNECTIONS: 'settings.connections', // API keys, env vars — IT only

  // Deploy — IT/Master Admin only
  DEPLOY_VIEW:          'deploy.view',
  DEPLOY_TRIGGER:       'deploy.trigger',
  DEPLOY_ROLLBACK:      'deploy.rollback',

  // Permissions management
  PERMISSIONS_VIEW:     'permissions.view',
  PERMISSIONS_EDIT:     'permissions.edit',

  // Newsletter
  NEWSLETTER_VIEW:      'newsletter.view',
  NEWSLETTER_EXPORT:    'newsletter.export',

  // Waitlist
  WAITLIST_VIEW:        'waitlist.view',
  WAITLIST_EXPORT:      'waitlist.export',

  // Quiz
  QUIZ_VIEW:            'quiz.view',
  QUIZ_MANAGE:          'quiz.manage',

  // Chat
  CHAT_VIEW:            'chat.view',
  CHAT_MANAGE:          'chat.manage',
} as const

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ── Full permission definitions (label + description shown in admin UI) ────────
export const PERMISSION_DEFINITIONS: Array<{
  key: PermissionKey
  label: string
  description: string
  category: string
}> = [
  // Content
  { key: 'content.view',    category: 'content',       label: 'View content',          description: 'See all pages and articles in the CMS.' },
  { key: 'content.create',  category: 'content',       label: 'Create content',         description: 'Write new articles and add content blocks.' },
  { key: 'content.edit',    category: 'content',       label: 'Edit content',           description: 'Edit existing articles and content blocks.' },
  { key: 'content.publish', category: 'content',       label: 'Publish content',        description: 'Publish drafts to the live site.' },
  { key: 'content.delete',  category: 'content',       label: 'Delete content',         description: 'Permanently delete pages and articles.' },

  // Users
  { key: 'users.view',          category: 'users', label: 'View users',            description: 'See the full user list and individual user details.' },
  { key: 'users.invite',        category: 'users', label: 'Invite team members',   description: 'Send invitations to new admin, manager, or employee accounts.' },
  { key: 'users.edit',          category: 'users', label: 'Edit user details',     description: 'Update a user\'s name, email, and notification preferences.' },
  { key: 'users.delete',        category: 'users', label: 'Delete users',          description: 'Permanently delete a user account.' },
  { key: 'users.manage_roles',  category: 'users', label: 'Change user roles',     description: 'Promote or demote users between roles.' },
  { key: 'users.impersonate',   category: 'users', label: 'Impersonate users',     description: 'Log in as another user to troubleshoot issues on their behalf.' },

  // Subscriptions
  { key: 'subscriptions.view',            category: 'subscriptions', label: 'View subscriptions',      description: 'See subscriber list and subscription details.' },
  { key: 'subscriptions.manage_plans',    category: 'subscriptions', label: 'Manage subscription plans', description: 'Add, edit, and remove subscription tiers.' },
  { key: 'subscriptions.manage_members',  category: 'subscriptions', label: 'Manage subscribers',      description: 'Manually assign or change a subscriber\'s plan.' },
  { key: 'subscriptions.pause',           category: 'subscriptions', label: 'Pause subscriptions',     description: 'Pause a subscriber\'s plan on their behalf.' },
  { key: 'subscriptions.cancel',          category: 'subscriptions', label: 'Cancel subscriptions',    description: 'Cancel a subscriber\'s plan.' },
  { key: 'subscriptions.refund',          category: 'subscriptions', label: 'Issue subscription refunds', description: 'Process refunds for subscription payments.' },

  // Store
  { key: 'store.view',             category: 'store', label: 'View store',           description: 'See the product catalogue and store settings.' },
  { key: 'store.manage_products',  category: 'store', label: 'Manage products',      description: 'Add, edit, and remove products and variants.' },
  { key: 'store.view_orders',      category: 'store', label: 'View orders',          description: 'See all customer orders and their status.' },
  { key: 'store.manage_orders',    category: 'store', label: 'Manage orders',        description: 'Update order status, add tracking numbers, and fulfil orders.' },
  { key: 'store.refund',           category: 'store', label: 'Issue order refunds',  description: 'Process refunds for product orders.' },

  // Support
  { key: 'support.view',    category: 'support', label: 'View support tickets',   description: 'See all support tickets and AI chat logs.' },
  { key: 'support.respond', category: 'support', label: 'Respond to tickets',     description: 'Send replies to customer support tickets.' },
  { key: 'support.close',   category: 'support', label: 'Close tickets',          description: 'Mark tickets as resolved or closed.' },
  { key: 'support.assign',  category: 'support', label: 'Assign tickets',         description: 'Assign tickets to a specific team member.' },
  { key: 'support.delete',  category: 'support', label: 'Delete tickets',         description: 'Permanently delete support tickets.' },

  // Help centre
  { key: 'help.view',            category: 'help', label: 'View help centre',      description: 'See knowledge base articles and feature requests.' },
  { key: 'help.manage_kb',       category: 'help', label: 'Manage knowledge base', description: 'Create, edit, and publish KB articles.' },
  { key: 'help.manage_requests', category: 'help', label: 'Manage feature requests', description: 'Update status of feature requests and the public roadmap.' },

  // Analytics
  { key: 'analytics.view',   category: 'analytics', label: 'View analytics',    description: 'See visitor stats, revenue, and conversion data.' },
  { key: 'analytics.export', category: 'analytics', label: 'Export analytics',  description: 'Download analytics data as CSV.' },

  // Changelog
  { key: 'changelog.view',   category: 'changelog', label: 'View changelog',    description: 'See the log of all platform events.' },
  { key: 'changelog.create', category: 'changelog', label: 'Add changelog note', description: 'Manually add an entry to the changelog.' },

  // Features
  { key: 'features.view',   category: 'features', label: 'View features',      description: 'See which features are enabled.' },
  { key: 'features.toggle', category: 'features', label: 'Toggle features',    description: 'Turn site features on and off.' },

  // Settings
  { key: 'settings.view',        category: 'settings', label: 'View settings',         description: 'See all site settings.' },
  { key: 'settings.edit',        category: 'settings', label: 'Edit settings',         description: 'Change site identity, design, email, and other settings.' },
  { key: 'settings.connections', category: 'settings', label: 'Manage connections',    description: 'Access API keys, environment variables, and third-party integrations. IT use only.' },

  // Deploy
  { key: 'deploy.view',     category: 'deploy', label: 'View deploy panel',   description: 'See deployment history and backup list.' },
  { key: 'deploy.trigger',  category: 'deploy', label: 'Deploy to production', description: 'Push a new deployment to the live site. IT use only.' },
  { key: 'deploy.rollback', category: 'deploy', label: 'Roll back deployment', description: 'Restore a previous version of the site. IT use only.' },

  // Permissions
  { key: 'permissions.view', category: 'permissions', label: 'View permissions',   description: 'See the permissions assigned to each role.' },
  { key: 'permissions.edit', category: 'permissions', label: 'Edit permissions',   description: 'Change which permissions each role has.' },

  // Newsletter
  { key: 'newsletter.view',   category: 'newsletter', label: 'View newsletter subscribers', description: 'See the list of newsletter subscribers.' },
  { key: 'newsletter.export', category: 'newsletter', label: 'Export newsletter list',       description: 'Download the newsletter subscriber list as a CSV.' },

  // Waitlist
  { key: 'waitlist.view',   category: 'waitlist', label: 'View waitlist',        description: 'See the list of waitlist sign-ups.' },
  { key: 'waitlist.export', category: 'waitlist', label: 'Export waitlist',      description: 'Download the waitlist as a CSV.' },

  // Quiz
  { key: 'quiz.view',   category: 'quiz', label: 'View quiz',        description: 'See quiz questions and response results.' },
  { key: 'quiz.manage', category: 'quiz', label: 'Manage quiz',       description: 'Create, edit, and delete quiz questions and answers.' },

  // Chat
  { key: 'chat.view',   category: 'chat', label: 'View chat logs',   description: 'See AI chat sessions and message history.' },
  { key: 'chat.manage', category: 'chat', label: 'Manage chat',       description: 'Delete chat sessions and configure chat settings.' },
]

// ── Default permissions per role ──────────────────────────────────────────────
export const ROLE_DEFAULTS: Record<string, PermissionKey[]> = {
  master_admin: Object.values(PERMISSIONS) as PermissionKey[], // everything

  // Business administrator — full operational control, no IT/security panel.
  // Manages everything the business needs; cannot touch server config or change role permissions.
  admin: [
    'content.view', 'content.create', 'content.edit', 'content.publish', 'content.delete',
    'users.view', 'users.invite', 'users.edit', 'users.delete', 'users.manage_roles',
    'subscriptions.view', 'subscriptions.manage_plans', 'subscriptions.manage_members',
    'subscriptions.pause', 'subscriptions.cancel', 'subscriptions.refund',
    'store.view', 'store.manage_products', 'store.view_orders', 'store.manage_orders', 'store.refund',
    'support.view', 'support.respond', 'support.close', 'support.assign', 'support.delete',
    'help.view', 'help.manage_kb', 'help.manage_requests',
    'analytics.view', 'analytics.export',
    'changelog.view', 'changelog.create',
    'features.view', 'features.toggle',
    'settings.view', 'settings.edit',
    'deploy.view',
    'permissions.view',
    'newsletter.view', 'newsletter.export',
    'waitlist.view', 'waitlist.export',
    'quiz.view', 'quiz.manage',
    'chat.view', 'chat.manage',
    // NOT: settings.connections, deploy.trigger, deploy.rollback,
    //      users.impersonate, permissions.edit (only master_admin changes role permissions)
  ],

  // Operations manager — runs day-to-day, handles customers and content.
  // Can manage orders, subscriptions, and support but cannot delete, refund, or touch settings.
  manager: [
    'content.view', 'content.create', 'content.edit', 'content.publish',
    // NOT content.delete — escalate to admin
    'users.view', 'users.invite',
    // Can invite employees only; cannot edit roles, delete users, or manage accounts
    'subscriptions.view', 'subscriptions.manage_members', 'subscriptions.pause', 'subscriptions.cancel',
    // NOT manage_plans (strategic, admin only), NOT refund (financial, admin only)
    'store.view', 'store.view_orders', 'store.manage_orders',
    // NOT manage_products (catalogue changes are admin level), NOT store.refund
    'support.view', 'support.respond', 'support.close', 'support.assign',
    // NOT support.delete
    'help.view', 'help.manage_kb', 'help.manage_requests',
    'analytics.view', 'analytics.export',
    'changelog.view', 'changelog.create',
    'newsletter.view', 'newsletter.export',
    'waitlist.view', 'waitlist.export',
    'quiz.view', 'quiz.manage',
    'chat.view',
    // NOT: features.toggle, settings (any), deploy, permissions, chat.manage,
    //      users.edit/delete/manage_roles, subscriptions.manage_plans/refund, store.manage_products/refund
  ],

  // Front-line employee — customer service and order fulfilment only.
  // Read access to most areas; can act only on support tickets and orders.
  employee: [
    'content.view',
    // NOT create/edit/publish/delete — content is managed by manager and above
    'subscriptions.view',
    // NOT any subscription management
    'store.view', 'store.view_orders', 'store.manage_orders',
    // NOT manage_products, NOT refund
    'support.view', 'support.respond',
    // NOT close, assign, delete — escalate to manager
    'help.view',
    'newsletter.view',
    'waitlist.view',
    'quiz.view',
    'chat.view',
    // NOT: users, analytics, changelog, features, settings, deploy, permissions,
    //      content editing, any management or export actions
  ],
}

// Category display order and labels for the permissions UI
export const PERMISSION_CATEGORIES: Array<{ key: string; label: string; icon: string }> = [
  { key: 'content',       label: 'Content management',   icon: '❧' },
  { key: 'users',         label: 'User management',       icon: '◉' },
  { key: 'subscriptions', label: 'Subscriptions',         icon: '✦' },
  { key: 'store',         label: 'Store & orders',        icon: '⊡' },
  { key: 'support',       label: 'Support',               icon: '✉' },
  { key: 'help',          label: 'Help centre',           icon: '?' },
  { key: 'analytics',     label: 'Analytics',             icon: '◎' },
  { key: 'changelog',     label: 'Changelog',             icon: '◈' },
  { key: 'features',      label: 'Features',              icon: '⚙' },
  { key: 'settings',      label: 'Settings',              icon: '≡' },
  { key: 'deploy',        label: 'Deploy & backups',      icon: '▲' },
  { key: 'permissions',   label: 'Permissions',           icon: '🔑' },
  { key: 'newsletter',    label: 'Newsletter',            icon: '✉' },
  { key: 'waitlist',      label: 'Waitlist',              icon: '◉' },
  { key: 'quiz',          label: 'Recommendation quiz',  icon: '?' },
  { key: 'chat',          label: 'AI chat',               icon: '✦' },
]

// ── Runtime permission check ──────────────────────────────────────────────────

/**
 * Check if a user has a specific permission.
 * Order: user override → role permission → false
 */
export async function hasPermission(
  userId: string,
  role: string,
  permissionKey: PermissionKey
): Promise<boolean> {
  // Master admin always has everything — skip DB lookup
  if (role === 'master_admin') return true

  // Find the permission record
  const permission = await db.permission.findUnique({ where: { key: permissionKey } })
  if (!permission) return false

  // Check per-user override first
  const userOverride = await db.userPermission.findUnique({
    where: { userId_permissionId: { userId, permissionId: permission.id } },
  })
  if (userOverride !== null) return userOverride.granted

  // Fall back to role-level permission
  const rolePermission = await db.rolePermission.findUnique({
    where: { role_permissionId: { role, permissionId: permission.id } },
  })
  return rolePermission?.granted ?? false
}

/**
 * Get the full permission map for a user (all keys → true/false).
 * Efficient single call — loads role permissions then applies user overrides.
 */
export async function getUserPermissions(
  userId: string,
  role: string
): Promise<Record<string, boolean>> {
  if (role === 'master_admin') {
    return Object.fromEntries(PERMISSION_DEFINITIONS.map((p) => [p.key, true]))
  }

  const [rolePerms, userOverrides] = await Promise.all([
    db.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    }),
    db.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    }),
  ])

  const map: Record<string, boolean> = {}

  // Start from role permissions
  for (const rp of rolePerms) {
    map[rp.permission.key] = rp.granted
  }

  // Apply user overrides
  for (const up of userOverrides) {
    map[up.permission.key] = up.granted
  }

  return map
}
