import { AuthCard } from '@/components/auth/AuthCard'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we will send you a reset link."
      footerLinks={[{ label: 'Back to sign in', href: '/login' }]}
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
