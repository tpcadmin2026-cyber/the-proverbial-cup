import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Subscriptions' }
import { redirect } from 'next/navigation'
export default function SubscriptionsIndex() { redirect('/admin/subscriptions/plans') }
