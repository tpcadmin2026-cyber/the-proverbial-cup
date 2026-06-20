import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'System' }
import { redirect } from 'next/navigation'
export default function SystemRedirect() { redirect('/admin/settings/system') }
