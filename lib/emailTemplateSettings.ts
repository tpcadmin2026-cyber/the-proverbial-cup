import { db } from './db'

// Editable copy for system emails — heading/subheading/intro only. Everything
// else (links, buttons, legal notices, line-item tables) stays fixed in the
// template component so an admin can't accidentally break something functional.
// Write {siteName} anywhere in the text and it'll be swapped for the real site name.

interface EmailTemplateField {
  key: 'heading' | 'subheading' | 'intro'
  label: string
  default: string
  multiline?: boolean
}

interface EmailTemplateDef {
  templateKey: string   // matches the preview route's [template] param
  settingPrefix: string // e.g. 'emailTemplates.verify'
  label: string
  fields: EmailTemplateField[]
}

export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    templateKey: 'verify',
    settingPrefix: 'emailTemplates.verify',
    label: 'Email verification',
    fields: [
      { key: 'heading', label: 'Heading', default: 'Confirm Your Correspondence' },
      { key: 'subheading', label: 'Subheading', default: '— Email Verification —' },
      { key: 'intro', label: 'Intro paragraph', default: 'Welcome to {siteName}. We are delighted to have you among our subscribers. Before we may proceed, we ask that you confirm your correspondence address by following the link below.', multiline: true },
    ],
  },
  {
    templateKey: 'reset',
    settingPrefix: 'emailTemplates.reset',
    label: 'Password reset',
    fields: [
      { key: 'heading', label: 'Heading', default: 'Password Reset Request' },
      { key: 'subheading', label: 'Subheading', default: '— From the Office of the Registrar —' },
      { key: 'intro', label: 'Intro paragraph', default: 'A request has been received to reset the password for your {siteName} account. If this was indeed your doing, please follow the link below to establish a new password at your earliest convenience.', multiline: true },
    ],
  },
  {
    templateKey: 'invite',
    settingPrefix: 'emailTemplates.invite',
    label: 'Team invitation',
    fields: [
      { key: 'heading', label: 'Heading', default: 'You Have Been Invited' },
      { key: 'subheading', label: 'Subheading', default: '— A Staff Appointment —' },
    ],
  },
  {
    templateKey: 'subscription',
    settingPrefix: 'emailTemplates.subscription',
    label: 'Subscription confirmation',
    fields: [
      { key: 'heading', label: 'Heading', default: 'Subscription Confirmed' },
      { key: 'subheading', label: 'Subheading', default: '— Welcome to the Gazette —' },
      { key: 'intro', label: 'Intro paragraph', default: 'We are most pleased to confirm that your subscription to {siteName} has been successfully established. Your first edition will be dispatched at the earliest opportunity.', multiline: true },
    ],
  },
  {
    templateKey: 'newsletterConfirm',
    settingPrefix: 'emailTemplates.newsletterConfirm',
    label: 'Newsletter confirmation',
    fields: [
      { key: 'heading', label: 'Heading', default: 'Confirm Your Subscription' },
      { key: 'subheading', label: 'Subheading', default: '— Despatches from the Gazette —' },
      { key: 'intro', label: 'Intro paragraph', default: 'Thank you for enrolling in our correspondence list. Please confirm your subscription by following the link below — you\'ll receive nothing further until you do.', multiline: true },
    ],
  },
  {
    templateKey: 'order',
    settingPrefix: 'emailTemplates.order',
    label: 'Order confirmation',
    fields: [
      { key: 'heading', label: 'Heading', default: 'Order Confirmed' },
      { key: 'subheading', label: 'Subheading', default: '— Receipt of Purchase —' },
      { key: 'intro', label: 'Intro paragraph', default: 'We have received your order and are preparing it for despatch forthwith. A summary of your purchase is recorded below for your records.', multiline: true },
    ],
  },
]

export function applyTokens(text: string, siteName: string): string {
  return text.replaceAll('{siteName}', siteName)
}

// Self-healing — creates any missing rows the first time the email-templates
// admin page loads, so this works after deploy without a hand-run migration.
export async function ensureEmailTemplateSettings(): Promise<void> {
  for (const tpl of EMAIL_TEMPLATES) {
    for (const field of tpl.fields) {
      const key = `${tpl.settingPrefix}.${field.key}`
      await db.setting.upsert({
        where: { key },
        update: {},
        create: {
          key,
          group: 'emailTemplates',
          value: JSON.stringify(field.default),
          label: `${tpl.label} — ${field.label}`,
          helpText: 'Write {siteName} anywhere you want the site name inserted.',
          inputType: field.multiline ? 'textarea' : 'text',
        },
      })
    }
  }
}

export type EmailTemplateOverrides = { heading?: string; subheading?: string; intro?: string }

// Fetches this template's saved copy (already token-substituted) — used both by
// the real send functions and the admin preview, so preview always matches reality.
export async function getEmailTemplateOverrides(templateKey: string, siteName: string): Promise<EmailTemplateOverrides> {
  const tpl = EMAIL_TEMPLATES.find((t) => t.templateKey === templateKey)
  if (!tpl) return {}

  const keys = tpl.fields.map((f) => `${tpl.settingPrefix}.${f.key}`)
  const rows = await db.setting.findMany({ where: { key: { in: keys } } })

  const out: EmailTemplateOverrides = {}
  for (const field of tpl.fields) {
    const row = rows.find((r) => r.key === `${tpl.settingPrefix}.${field.key}`)
    const raw = row ? (() => { try { return JSON.parse(row.value) as string } catch { return row.value } })() : field.default
    out[field.key] = applyTokens(raw, siteName)
  }
  return out
}
