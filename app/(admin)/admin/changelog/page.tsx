import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Changelog' }
import { redirect } from 'next/navigation'
export default function ChangelogRedirect() { redirect('/admin/settings/changelog') }
