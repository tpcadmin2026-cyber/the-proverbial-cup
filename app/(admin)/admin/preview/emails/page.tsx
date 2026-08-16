import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'

const TEMPLATES = [
  { key: 'verify',         label: 'Email verification',       description: 'Sent when a new account is created', editable: true },
  { key: 'newsletterConfirm', label: 'Newsletter confirmation', description: 'Sent when someone signs up for the newsletter — they must click through before they\'re marked confirmed', editable: true },
  { key: 'reset',          label: 'Password reset',           description: 'Sent when a password reset is requested', editable: true },
  { key: 'invite',         label: 'Team invitation',          description: 'Sent when a staff member is invited', editable: true },
  { key: 'subscription',   label: 'Subscription confirmation', description: 'Sent when a subscription is activated', editable: true },
  { key: 'order',          label: 'Order confirmation',       description: 'Sent when a shop order is placed', editable: true },
  { key: 'backup',         label: 'Backup notification',      description: 'Sent when a backup completes', editable: false },
]

export default function EmailPreviewPage() {
  return (
    <>
      <AdminHeader
        title="Email previews"
        subtitle="Preview each email template as it will appear to recipients. No emails are sent."
      />
      <div className="p-8">
        <div className="grid gap-4 max-w-2xl">
          {TEMPLATES.map((t) => (
            <div key={t.key} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {t.editable && (
                  <Link
                    href={`/admin/preview/emails/${t.key}`}
                    className="px-4 py-2 text-xs font-semibold bg-[#C4AB77] text-white rounded hover:bg-[#7a5c10] transition-colors"
                  >
                    Edit
                  </Link>
                )}
                <Link
                  href={`/api/admin/preview/email/${t.key}`}
                  target="_blank"
                  className="px-4 py-2 text-xs font-semibold border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Preview →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Previews use placeholder data. Actual emails are sent with real content from the database.
        </p>
      </div>
    </>
  )
}
