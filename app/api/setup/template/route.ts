import { NextRequest, NextResponse } from 'next/server'
import { isSetupNeeded, setupFromTemplate, type TemplateData } from '@/lib/templates'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'

// GET — check if a fresh-install setup is needed
export async function GET() {
  const needed = await isSetupNeeded()
  return NextResponse.json({ setupNeeded: needed })
}

// POST — run fresh-install setup from a template
export async function POST(req: NextRequest) {
  try {
    const needed = await isSetupNeeded()
    if (!needed) {
      return NextResponse.json(
        { error: 'This site is already configured. Use Admin → Settings → Templates to import a template instead.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { template, adminEmail, adminPassword, adminName, siteName, tagline, contactEmail } = body

    if (!adminEmail || !adminPassword || !adminName) {
      return NextResponse.json({ error: 'Admin name, email, and password are required.' }, { status: 400 })
    }
    if (adminPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    if (template) {
      const templateData = template as TemplateData
      if (!templateData.templateVersion) {
        return NextResponse.json({ error: 'Invalid template file.' }, { status: 400 })
      }
      await setupFromTemplate(templateData, adminEmail, adminPassword, adminName, {
        siteName: siteName || undefined,
        tagline: tagline || undefined,
        contactEmail: contactEmail || undefined,
      })
    } else {
      // No template — run the standard seed then create the admin
      const { execSync } = await import('child_process')
      try {
        execSync('pnpm db:seed', { stdio: 'ignore', cwd: process.cwd() })
      } catch {
        // seed may fail in some envs — continue anyway, site will be usable
      }
      const passwordHash = await hashPassword(adminPassword)
      await db.user.upsert({
        where: { email: adminEmail },
        update: { role: 'master_admin', name: adminName, passwordHash, emailVerified: new Date() },
        create: { email: adminEmail, name: adminName, role: 'master_admin', passwordHash, emailVerified: new Date() },
      })
      if (siteName) await db.setting.updateMany({ where: { key: 'site.name' }, data: { value: JSON.stringify(siteName) } })
      if (tagline) await db.setting.updateMany({ where: { key: 'site.tagline' }, data: { value: JSON.stringify(tagline) } })
      if (contactEmail) await db.setting.updateMany({ where: { key: 'site.contactEmail' }, data: { value: JSON.stringify(contactEmail) } })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
