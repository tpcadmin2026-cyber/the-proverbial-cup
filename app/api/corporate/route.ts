import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isEnabled } from '@/lib/features'

export async function GET() {
  const accounts = await db.corporateAccount.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { gifts: true } } },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  if (!await isEnabled('corporate_gifting')) return NextResponse.json({ error: 'Corporate gifting is not enabled.' }, { status: 403 })
  try {
    const { companyName, contactEmail, contactName, message } = await req.json()

    if (!companyName?.trim() || !contactEmail?.trim()) {
      return NextResponse.json({ error: 'Company name and email are required.' }, { status: 400 })
    }

    const account = await db.corporateAccount.create({
      data: {
        companyName: companyName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactName: contactName?.trim() || null,
      },
    })

    // Create a support ticket so the team knows to follow up
    await db.supportTicket.create({
      data: {
        subject: `Corporate gifting enquiry — ${companyName.trim()}`,
        body: `Company: ${companyName}\nContact: ${contactName ?? 'N/A'}\nEmail: ${contactEmail}\n\n${message ?? ''}`.trim(),
        customerEmail: contactEmail.trim().toLowerCase(),
        customerName: contactName?.trim() || null,
        priority: 'high',
      },
    })

    return NextResponse.json({ success: true, account })
  } catch (err: unknown) {
    const isUnique = err instanceof Error && err.message.includes('Unique constraint')
    if (isUnique) return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to register account.' }, { status: 500 })
  }
}
