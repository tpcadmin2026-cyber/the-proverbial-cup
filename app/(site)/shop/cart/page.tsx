import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/features'
import { CartView } from './CartView'

export default async function CartPage() {
  if (!await isEnabled('ecommerce')) notFound()
  return <CartView />
}
