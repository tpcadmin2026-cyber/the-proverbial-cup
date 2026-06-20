import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Support' }
import { redirect } from 'next/navigation'
export default function SupportIndex() { redirect('/admin/support/tickets') }
