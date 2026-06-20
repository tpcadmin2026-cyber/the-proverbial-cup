import Link from 'next/link'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import { format } from 'date-fns'

const TYPE_LABELS: Record<string, string> = {
  deploy:          'New release',
  feature_toggle:  'Feature update',
  content_save:    'Content update',
  settings_change: 'Settings update',
  manual:          'Note',
}

export default async function PublicChangelogPage() {
  const [isPublic, siteName] = await Promise.all([
    getSetting<boolean>('changelog.public', false),
    getSetting<string>('site.name', 'The Proverbial Cup'),
  ])
  if (!isPublic) {
    return <FeatureDisabled siteName={siteName} title="Release Notes" message="Our public changelog is not yet enabled." />
  }

  const entries = await db.changelogEntry.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}>
              {siteName}
            </div>
          </Link>
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
            <span className="text-[#C4AB77]">✦</span>
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
          </div>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-4">
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">Platform Dispatches</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44]">
            A record of improvements and updates to The Gazette.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
            <p className="font-baskerville italic text-[#4B4C44]">No dispatches have been published yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden shadow-sm">
                <div className="h-0.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#C4AB77] uppercase tracking-widest">
                        {TYPE_LABELS[entry.eventType] ?? entry.eventType}
                      </span>
                    </div>
                    <time className="text-xs text-[#C4AB77] font-baskerville italic">
                      {format(entry.createdAt, 'dd MMMM yyyy')}
                    </time>
                  </div>
                  <h2 className="font-playfair text-lg text-[#35291C] mb-1">{entry.title}</h2>
                  {entry.description && (
                    <p className="font-baskerville text-[#4B4C44] text-sm leading-relaxed">{entry.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10 text-xs text-[#4B4C44]">
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return to The Gazette</Link>
        </div>
      </div>
    </div>
  )
}
