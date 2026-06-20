import Link from 'next/link'
import { getSetting } from '@/lib/settings'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footerLinks?: Array<{ label: string; href: string }>
}

export async function AuthCard({ title, subtitle, children, footerLinks }: AuthCardProps) {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl border border-[#c8c4a8] shadow-lg overflow-hidden">
          {/* Victorian header */}
          <div className="bg-[#35291C] px-8 py-6 text-center">
            <Link href="/" className="inline-block">
              <div className="text-[#C4AB77] text-sm tracking-widest mb-1">✦ ✦ ✦</div>
              <div
                className="text-[#E8E6D8] text-2xl leading-tight"
                style={{ fontFamily: "'Anton', sans-serif" }}
              >
                {siteName}
              </div>
            </Link>
          </div>

          {/* Rule */}
          <div className="h-1.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

          {/* Content */}
          <div className="px-8 py-7">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[#35291C]">{title}</h1>
              {subtitle && <p className="text-sm text-[#4B4C44] mt-1">{subtitle}</p>}
            </div>
            {children}
          </div>

          {/* Footer links */}
          {footerLinks && footerLinks.length > 0 && (
            <div className="px-8 pb-6 flex flex-wrap gap-x-4 gap-y-1 justify-center">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-[#C4AB77] hover:text-[#7A564C] hover:underline transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Back to site */}
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
            ← Return to {siteName}
          </Link>
        </div>
      </div>
    </div>
  )
}
