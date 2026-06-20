import { AuthCard } from '@/components/auth/AuthCard'
import { ResetPasswordForm } from './ResetPasswordForm'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string }
}) {
  if (!searchParams.token || !searchParams.email) {
    return (
      <AuthCard title="Invalid link" footerLinks={[{ label: 'Request a new link', href: '/forgot-password' }]}>
        <p className="text-sm text-[#4B4C44]">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Set a new password"
      footerLinks={[{ label: 'Back to sign in', href: '/login' }]}
    >
      <ResetPasswordForm token={searchParams.token} email={searchParams.email} />
    </AuthCard>
  )
}
