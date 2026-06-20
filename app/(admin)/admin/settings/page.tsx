import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Settings' }
import { redirect } from 'next/navigation'
export default function SettingsIndex() { redirect('/admin/settings/site') }
