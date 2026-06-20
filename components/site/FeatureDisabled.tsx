import Link from 'next/link'

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

interface Props {
  siteName: string
  title: string
  message?: string
}

export function FeatureDisabled({ siteName, title, message }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: GRAIN,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-lg w-full text-center">
        <div className="bg-white border border-[#c8c4a8] rounded-lg shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
          <div className="px-8 py-10">

            <div
              className="text-[#35291C] leading-tight mb-4"
              style={{ fontFamily: "'Anton', sans-serif", fontSize: '1.6rem' }}
            >
              {siteName}
            </div>

            <div className="flex items-center gap-3 justify-center mb-5">
              <div className="h-px flex-1 bg-[#C4AB77]" />
              <span className="text-[#C4AB77]">✦</span>
              <div className="h-px flex-1 bg-[#C4AB77]" />
            </div>

            <h1 className="font-playfair text-2xl text-[#35291C] tracking-wide mb-3">
              {title}
            </h1>

            <p className="font-baskerville text-lg italic text-[#4B4C44] mb-6 leading-relaxed">
              {message ?? 'This section of the Gazette is not yet available. Please call again at a later date.'}
            </p>

            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="h-px flex-1 bg-[#e8e4d0]" />
              <span className="text-[#c8c4a8] text-sm">⸻</span>
              <div className="h-px flex-1 bg-[#e8e4d0]" />
            </div>

            <Link
              href="/"
              className="inline-block bg-[#35291C] text-[#E8E6D8] px-6 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Return to {siteName}
            </Link>

          </div>
        </div>
      </div>
    </div>
  )
}
