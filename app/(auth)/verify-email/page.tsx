import { AuthCard } from '@/components/auth/AuthCard'
import { db } from '@/lib/db'
import { consumeVerificationToken } from '@/lib/auth-utils'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string }
}) {
  const { token, email } = searchParams

  if (!token || !email) {
    return (
      <AuthCard title="Invalid link" footerLinks={[{ label: 'Go to sign in', href: '/login' }]}>
        <p className="text-sm text-[#4B4C44]">This verification link is invalid.</p>
      </AuthCard>
    )
  }

  const valid = await consumeVerificationToken(email, token, 'verify')

  if (!valid) {
    return (
      <AuthCard title="Link expired" footerLinks={[{ label: 'Go to sign in', href: '/login' }]}>
        <p className="text-sm text-[#4B4C44]">
          This verification link has expired or already been used. Sign in and we can send you a new one.
        </p>
      </AuthCard>
    )
  }

  // Mark email as verified
  await db.user.updateMany({
    where: { email },
    data: { emailVerified: new Date() },
  })

  return (
    <AuthCard title="Email verified" footerLinks={[{ label: 'Sign in to your account', href: '/login' }]}>
      <div className="text-center space-y-3">
        <div className="text-3xl text-[#C4AB77]">✦</div>
        <p className="text-sm text-[#4B4C44]">
          Your email address has been verified. You may now sign in to your account.
        </p>
      </div>
    </AuthCard>
  )
}
