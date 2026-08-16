import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { NewIssueButton, SendIssueButton, DeleteIssueButton } from './NewspaperActions'

export const metadata: Metadata = { title: 'Newspaper' }

export default async function NewspapersPage() {
  const [issues, subscriberCount] = await Promise.all([
    db.cmsPage.findMany({
      where: { pageType: 'newspaper' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { blocks: true } } },
    }),
    db.newsletterSubscriber.count({ where: { confirmed: true, unsubscribedAt: null } }),
  ])

  return (
    <>
      <AdminHeader title="Newspaper" subtitle="Compose newspaper issues — The Proverbial Post — and email them to your confirmed subscribers." />
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {issues.length} issue{issues.length !== 1 ? 's' : ''} · {subscriberCount} confirmed subscriber{subscriberCount !== 1 ? 's' : ''}
          </p>
          <NewIssueButton />
        </div>
        {issues.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No issues yet. Create your first issue of The Proverbial Post.
          </div>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li key={issue.id} className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{issue.tabLabel}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {issue._count.blocks} block{issue._count.blocks !== 1 ? 's' : ''}
                    {issue.sentAt && <> · Sent {formatDistanceToNow(issue.sentAt, { addSuffix: true })}</>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${issue.sentAt ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {issue.sentAt ? 'Sent' : 'Draft'}
                </span>
                <Link href={`/admin/content/newspapers/${issue.id}`} className="text-sm text-[#C4AB77] hover:underline shrink-0">Edit</Link>
                <SendIssueButton issueId={issue.id} hasContent={issue._count.blocks > 0} subscriberCount={subscriberCount} />
                <DeleteIssueButton issueId={issue.id} issueLabel={issue.tabLabel} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
