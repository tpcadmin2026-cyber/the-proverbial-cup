import { AuthCard } from '@/components/auth/AuthCard'
import { AcceptInviteForm } from './AcceptInviteForm'

export default function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string; role?: string }
}) {
  const { token, email, role } = searchParams

  if (!token || !email) {
    return (
      <AuthCard title="Invalid invitation" footerLinks={[{ label: 'Go to sign in', href: '/login' }]}>
        <p className="text-sm text-[#4B4C44]">This invitation link is invalid or has expired.</p>
      </AuthCard>
    )
  }

  const roleLabel = role === 'master_admin' ? 'Master Admin' : 'Admin'

  return (
    <AuthCard
      title="Accept your invitation"
      subtitle={`You have been invited to join as ${roleLabel}. Create your password to get started.`}
    >
      <AcceptInviteForm token={token} email={email} role={role ?? 'admin'} />
    </AuthCard>
  )
}
