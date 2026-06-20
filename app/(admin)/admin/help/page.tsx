import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Help' }
import { redirect } from 'next/navigation'
export default function HelpIndex() { redirect('/admin/help/knowledge-base') }
