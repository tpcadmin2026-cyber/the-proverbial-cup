// Run with: pnpm create-admin
// Creates an admin user you can log in with locally without needing email.

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: pnpm create-admin your@email.com')
    process.exit(1)
  }

  const user = await db.user.upsert({
    where: { email },
    update: { role: 'admin', emailVerified: new Date() },
    create: {
      email,
      role: 'admin',
      name: 'Admin',
      emailVerified: new Date(),
    },
  })

  // Create a permanent session so you're logged in immediately on next page load
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  await db.session.upsert({
    where: { sessionToken: `local-dev-${email}` },
    update: { expires },
    create: {
      sessionToken: `local-dev-${email}`,
      userId: user.id,
      expires,
    },
  })

  console.log(`✓ Admin user created: ${email}`)
  console.log(`✓ Session token:      local-dev-${email}`)
  console.log()
  console.log('To log in, paste this into your browser console at http://localhost:3000:')
  console.log()
  console.log(`document.cookie = 'authjs.session-token=local-dev-${email}; path=/; max-age=31536000'`)
  console.log()
  console.log('Then refresh the page and go to http://localhost:3000/admin')
}

main().catch(console.error).finally(() => db.$disconnect())
