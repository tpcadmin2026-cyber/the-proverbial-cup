import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { db } from '@/lib/db'
import { CartProvider } from '@/components/site/CartContext'
import { FooterWrapper } from '@/components/site/FooterWrapper'
import { ChatWidget } from '@/components/site/ChatWidget'
import { PostHogProvider } from '@/components/site/PostHogProvider'

export async function generateMetadata(): Promise<Metadata> {
  const [name, tagline, faviconUrl] = await Promise.all([
    getSetting<string>('site.name', 'My Site'),
    getSetting<string>('site.tagline', ''),
    getSetting<string>('site.faviconUrl', ''),
  ])
  return {
    title: { template: `%s | ${name}`, default: name },
    description: tagline,
    icons: faviconUrl ? { icon: faviconUrl, apple: faviconUrl } : undefined,
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [privateMode, headerList, aiEnabled, analyticsEnabled, personaName, welcomeMsg, widgetPos, phKey, phHost] = await Promise.all([
    getSetting<boolean>('maintenance.private_mode', false),
    headers(),
    isEnabled('ai_chat'),
    isEnabled('analytics'),
    getSetting<string>('ai.personaName', 'Cornelius'),
    getSetting<string>('ai.welcomeMessage', 'Good day! I am Cornelius. How may I be of service?'),
    getSetting<string>('ai.widgetPosition', 'bottom-right'),
    getSetting<string>('analytics.posthogKey', ''),
    getSetting<string>('analytics.posthogHost', 'https://app.posthog.com'),
  ])
  const pathname = headerList.get('x-pathname') ?? ''

  if (privateMode) {
    // Allow logged-in users through; send guests to coming-soon
    const cookieStore = await cookies()
    const token = cookieStore.get('authjs.session-token')?.value

    // Don't redirect if already on the coming-soon or auth pages
    const exempt = pathname.startsWith('/coming-soon') ||
                   pathname.startsWith('/login') ||
                   pathname.startsWith('/signup') ||
                   pathname.startsWith('/forgot-password') ||
                   pathname.startsWith('/reset-password') ||
                   pathname.startsWith('/verify-email') ||
                   pathname.startsWith('/accept-invite')

    if (!exempt) {
      if (!token) {
        redirect('/coming-soon')
      } else {
        const session = await db.session.findUnique({
          where: { sessionToken: token },
          select: { expires: true },
        })
        if (!session || session.expires < new Date()) redirect('/coming-soon')
      }
    }
  }

  const isNewspaper = pathname === '/' || pathname === ''

  return (
    <PostHogProvider apiKey={analyticsEnabled ? phKey : ''} host={phHost}>
      <CartProvider>
        <div className={`site-root${isNewspaper ? ' newspaper-layout' : ''}`}>
          {children}
          {!isNewspaper && <FooterWrapper />}
          {aiEnabled && (
            <ChatWidget
              personaName={personaName}
              welcomeMessage={welcomeMsg}
              position={widgetPos as 'bottom-right' | 'bottom-left'}
            />
          )}
        </div>
      </CartProvider>
    </PostHogProvider>
  )
}
