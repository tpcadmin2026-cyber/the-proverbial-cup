import { getStripeAsync } from './stripe'
import { getSetting } from './settings'

// Keeps a Stripe Product record's name/description in sync. Creates one on
// first call (no existing id), otherwise updates in place — Product objects
// are mutable in Stripe, unlike Prices.
export async function syncStripeProductRecord(opts: {
  name: string
  description?: string | null
  existingStripeProductId?: string | null
  metadata?: Record<string, string>
}): Promise<string | null> {
  const stripe = await getStripeAsync()
  if (!stripe) return opts.existingStripeProductId ?? null

  if (opts.existingStripeProductId) {
    await stripe.products.update(opts.existingStripeProductId, {
      name: opts.name,
      description: opts.description || undefined,
      metadata: opts.metadata,
    })
    return opts.existingStripeProductId
  }

  const created = await stripe.products.create({
    name: opts.name,
    description: opts.description || undefined,
    metadata: opts.metadata,
  })
  return created.id
}

// Stripe Prices are immutable once created — if the amount changed (or there
// was no price yet), this creates a new one and archives the old one so it
// stops showing up as active in the Stripe dashboard. Existing Checkout
// Sessions/subscriptions already using the old price keep working.
export async function syncStripePrice(opts: {
  stripeProductId: string | null
  amountInCents: number | null | undefined
  existingAmountInCents?: number | null
  existingStripePriceId?: string | null
  recurring?: { interval: 'month' | 'year' }
}): Promise<string | null> {
  if (!opts.stripeProductId || opts.amountInCents == null) return opts.existingStripePriceId ?? null

  const stripe = await getStripeAsync()
  if (!stripe) return opts.existingStripePriceId ?? null

  const unchanged = !!opts.existingStripePriceId && opts.existingAmountInCents === opts.amountInCents
  if (unchanged) return opts.existingStripePriceId!

  const currency = (await getSetting<string>('payments.currency', 'USD')).toLowerCase()

  const newPrice = await stripe.prices.create({
    product: opts.stripeProductId,
    unit_amount: opts.amountInCents,
    currency,
    recurring: opts.recurring,
  })

  if (opts.existingStripePriceId) {
    await stripe.prices.update(opts.existingStripePriceId, { active: false }).catch(() => {})
  }

  return newPrice.id
}

// Best-effort archive — Stripe won't let you hard-delete a product that has
// prices attached, so we deactivate it instead. Never throws.
export async function archiveStripeProduct(stripeProductId: string | null | undefined) {
  if (!stripeProductId) return
  try {
    const stripe = await getStripeAsync()
    if (!stripe) return
    await stripe.products.update(stripeProductId, { active: false })
  } catch {
    // Non-fatal — the local record is already gone either way.
  }
}
