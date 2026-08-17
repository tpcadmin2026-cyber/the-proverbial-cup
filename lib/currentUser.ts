import { cookies } from 'next/headers'
import { db } from './db'

export interface CurrentUserInfo {
  name: string | null
  email: string
  planName: string | null
}

/** Resolves the signed-in visitor (if any) from the session cookie — used anywhere
 * the Account block might render (header, footer, page content) so it can show
 * profile links instead of the sign-in prompt. */
export async function getCurrentUser(): Promise<CurrentUserInfo | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    select: {
      expires: true,
      user: { select: { name: true, email: true, subscription: { select: { plan: { select: { name: true } } } } } },
    },
  })
  if (!session || session.expires < new Date()) return null

  return {
    name: session.user.name,
    email: session.user.email,
    planName: session.user.subscription?.plan.name ?? null,
  }
}
