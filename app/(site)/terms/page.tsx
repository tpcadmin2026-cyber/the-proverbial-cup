import type { Metadata } from 'next'
import Link from 'next/link'
import { getSetting } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: `Terms & Conditions` }
}

export default async function TermsPage() {
  const [siteName, content] = await Promise.all([
    getSetting<string>('site.name', 'My Site'),
    getSetting<string>('legal.termsContent', ''),
  ])

  const paragraphs = content
    ? content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-[#E8E6D8]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#4B4C44] hover:text-[#35291C] mb-10 transition-colors"
        >
          ← Back to {siteName}
        </Link>

        <h1 className="font-playfair text-4xl font-bold text-[#35291C] mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-[#4B4C44] mb-10 font-baskerville italic">
          {siteName}
        </p>

        <hr className="border-[#C4AB77] mb-10" />

        {paragraphs.length > 0 ? (
          <div className="space-y-5 font-baskerville text-[#4B4C44] leading-relaxed text-base">
            {paragraphs.map((para, i) => {
              if (para.startsWith('## ')) {
                return (
                  <h2 key={i} className="font-playfair text-xl font-bold text-[#35291C] pt-4">
                    {para.replace(/^## /, '')}
                  </h2>
                )
              }
              if (para.startsWith('# ')) {
                return (
                  <h2 key={i} className="font-playfair text-2xl font-bold text-[#35291C] pt-4">
                    {para.replace(/^# /, '')}
                  </h2>
                )
              }
              return <p key={i}>{para}</p>
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#C4AB77] rounded-lg p-8 text-center">
            <p className="font-playfair text-lg text-[#35291C] mb-2">Terms not yet published</p>
            <p className="font-baskerville text-sm text-[#4B4C44] italic">
              The site owner has not yet added terms &amp; conditions. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
