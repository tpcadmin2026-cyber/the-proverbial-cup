import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { db } from '@/lib/db'
import { EMAIL_TEMPLATES, ensureEmailTemplateSettings } from '@/lib/emailTemplateSettings'
import { PreviewFrame } from './PreviewFrame'

interface Props {
  params: Promise<{ key: string }>
}

export default async function EmailTemplateEditPage({ params }: Props) {
  const { key } = await params
  const tpl = EMAIL_TEMPLATES.find((t) => t.templateKey === key)
  if (!tpl) notFound()

  await ensureEmailTemplateSettings()

  const fieldKeys = tpl.fields.map((f) => `${tpl.settingPrefix}.${f.key}`)
  const rows = await db.setting.findMany({ where: { key: { in: fieldKeys } }, orderBy: { key: 'asc' } })

  return (
    <>
      <AdminHeader title={`Edit — ${tpl.label}`} subtitle="Change the heading and intro copy. Links, buttons, and legal notices stay fixed for safety." />
      <div className="p-8 max-w-2xl">
        <Link href="/admin/preview/emails" className="inline-block mb-4 text-xs text-[#C4AB77] hover:underline">← All email templates</Link>
        <SettingsGroupPage rows={rows} />
        <PreviewFrame src={`/api/admin/preview/email/${tpl.templateKey}`} />
      </div>
    </>
  )
}
