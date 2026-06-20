import type { Metadata } from 'next'
import { getSetting } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const name = await getSetting<string>('site.name', 'My Site')
  return { title: `${name} — Coming Soon` }
}

export default async function ComingSoonPage() {
  const [title, message, siteName] = await Promise.all([
    getSetting<string>('maintenance.coming_soon_title', 'Something Rather Splendid Is Coming'),
    getSetting<string>('maintenance.coming_soon_message', 'We are putting the finishing touches on something special. Check back soon.'),
    getSetting<string>('site.name', 'My Site'),
  ])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-2xl w-full text-center">
        {/* Ornamental rule */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-px flex-1 bg-[#C4AB77]" />
          <span className="text-[#C4AB77] text-lg">✦</span>
          <div className="h-px flex-1 bg-[#C4AB77]" />
        </div>

        {/* Masthead */}
        <div className="mb-2 text-[#C4AB77] text-xs tracking-[0.3em] uppercase font-semibold">
          A Notice to the Public
        </div>
        <h1
          className="text-[#35291C] leading-tight mb-6"
          style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}
        >
          {siteName}
        </h1>

        {/* Double rule */}
        <div className="border-t-4 border-b border-[#35291C] mb-6 pb-1 border-b-[#C4AB77]" />

        {/* Title */}
        <h2 className="font-playfair text-2xl text-[#35291C] mb-4 tracking-wide">
          {title}
        </h2>

        {/* Message */}
        <p className="font-baskerville text-lg italic text-[#4B4C44] leading-relaxed mb-8 px-4">
          {message}
        </p>

        {/* Ornament */}
        <div className="text-[#C4AB77] text-2xl tracking-widest mb-8">✦ ✦ ✦</div>

        {/* Rule */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C4AB77] to-transparent mb-8" />

        {/* Sign-in link */}
        <p className="text-xs text-[#4B4C44]">
          Already have an account?{' '}
          <a href="/login" className="text-[#C4AB77] hover:underline font-semibold">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  )
}
