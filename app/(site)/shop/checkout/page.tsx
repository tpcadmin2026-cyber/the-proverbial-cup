import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/features'
import { CheckoutForm } from './CheckoutForm'

export default async function CheckoutPage() {
  if (!await isEnabled('ecommerce')) notFound()
  return <CheckoutForm />
}
