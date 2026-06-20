'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  planSlug: string
  planName: string
  stripeConfigured: boolean
  hasPriceId: boolean
  currentUser: {
    id: string
    email: string
    name: string | null
    hasSubscription: boolean
  } | null
}

export function SubscribeActions({ planSlug, planName, stripeConfigured, hasPriceId, currentUser }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setSubmitting(true)
    setError(null)
    try {
      // Use Stripe Checkout when fully configured
      if (stripeConfigured && hasPriceId) {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'subscription', planSlug }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout')
        if (data.url) { window.location.href = data.url; return }
      }

      // Fallback: reserve without payment
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to reserve subscription')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="text-3xl text-[#C4AB77]">✦</div>
        <h2 className="font-playfair text-xl text-[#35291C]">Subscription Reserved</h2>
        <p className="font-baskerville italic text-[#4B4C44] leading-relaxed">
          Your subscription to <strong>{planName}</strong> has been reserved.
          Payment will be taken once our payment system is fully connected.
          You shall receive confirmation by post — or rather, by email — very shortly.
        </p>
        <Link
          href="/account"
          className="inline-block mt-4 px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
        >
          View your account →
        </Link>
      </div>
    )
  }

  if (!currentUser) {
    // Guest — prompt to create account or sign in
    return (
      <div className="space-y-4">
        <h3 className="font-playfair text-lg text-[#35291C] text-center mb-2">
          How would you like to proceed?
        </h3>
        <Link
          href={`/signup?plan=${planSlug}`}
          className="block w-full text-center py-3 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
        >
          Create a new account
        </Link>
        <Link
          href={`/login?redirect=/subscribe/${planSlug}`}
          className="block w-full text-center py-3 border-2 border-[#35291C] text-[#35291C] text-sm font-semibold rounded hover:bg-[#f0ebe0] transition-colors"
        >
          Sign in to my existing account
        </Link>
      </div>
    )
  }

  if (currentUser.hasSubscription) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-[#4B4C44]">
          You are currently subscribed to a plan. To change plans, please manage your subscription from your account.
        </p>
        <Link
          href="/account"
          className="inline-block px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
        >
          Manage my subscription
        </Link>
      </div>
    )
  }

  // Logged in, no subscription
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#4B4C44] text-center">
        You are signed in as <strong>{currentUser.email}</strong>.
      </p>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <button
        onClick={handleSubscribe}
        disabled={submitting}
        className="w-full py-3 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c12] transition-colors disabled:opacity-50"
      >
        {submitting ? 'Reserving your subscription…' : `Subscribe to ${planName}`}
      </button>
      <p className="text-xs text-center text-[#4B4C44]">
        Not you?{' '}
        <Link href={`/login?redirect=/subscribe/${planSlug}`} className="text-[#C4AB77] hover:underline">
          Sign in with a different account
        </Link>
      </p>
    </div>
  )
}
