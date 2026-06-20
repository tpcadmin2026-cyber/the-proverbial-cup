import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Deploy' }
import { redirect } from 'next/navigation'
export default function DeployRedirect() { redirect('/admin/settings/deploy') }
