import Stripe from 'stripe'
import { getSetting } from './settings'

// Synchronous — env var only. Use in routes that already have other async work.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

// Async — checks env var first, then DB setting.
export async function getStripeAsync(): Promise<Stripe | null> {
  const key = process.env.STRIPE_SECRET_KEY || await getSetting<string>('stripe.secretKey', '')
  if (!key) return null
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export async function stripeConfiguredAsync(): Promise<boolean> {
  const key = process.env.STRIPE_SECRET_KEY || await getSetting<string>('stripe.secretKey', '')
  return !!key
}
