import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { SignupForm } from './SignupForm'
import { db } from '@/lib/db'

export default async function SignupPage() {
  // Check if self-registration is enabled
  const setting = await db.setting.findUnique({ where: { key: 'auth.selfRegistration' } })
  const allowed = setting ? JSON.parse(setting.value) : true

  if (!allowed) {
    return (
      <AuthCard title="Registration closed">
        <p className="text-sm text-[#4B4C44]">
          New account registration is not currently open. Please contact us if you believe you
          should have access.
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Create your account to get started."
      footerLinks={[
        { label: 'Already have an account? Sign in', href: '/login' },
      ]}
    >
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AuthCard>
  )
}
