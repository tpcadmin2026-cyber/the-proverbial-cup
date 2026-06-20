import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('authjs.session-token')?.value
  if (token) await deleteSession(token)

  const response = NextResponse.redirect(new URL('/login', req.url))
  response.cookies.delete('authjs.session-token')
  return response
}
