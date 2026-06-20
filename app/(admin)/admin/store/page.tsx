import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Store' }
import { redirect } from 'next/navigation'
export default function StoreIndex() { redirect('/admin/store/products') }
