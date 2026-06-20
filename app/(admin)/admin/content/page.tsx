import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Content' }
import { redirect } from 'next/navigation'
export default function ContentIndex() { redirect('/admin/content/pages') }
