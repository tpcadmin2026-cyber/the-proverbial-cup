import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in to your account"
      subtitle="Welcome back to The Gazette."
      footerLinks={[
        { label: 'Forgot your password?', href: '/forgot-password' },
        { label: "Don't have an account? Sign up", href: '/signup' },
      ]}
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  )
}
