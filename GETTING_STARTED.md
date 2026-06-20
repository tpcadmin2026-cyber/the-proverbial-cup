# Gazette Platform — Getting Started

## Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL (local or hosted — Supabase, Neon, Railway all work)

## First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy the environment file and fill in your values
cp .env.example .env.local

# 3. Push the database schema (creates all tables)
pnpm db:push

# 4. Seed default settings, feature flags, and setup steps
pnpm db:seed

# 5. Start the development server
pnpm dev
```

Then open http://localhost:3000 — you'll be redirected to the setup wizard.

## Setup wizard
The wizard walks you through:
1. **Site identity** — name, tagline, contact email
2. **Template** — Victorian Illustrated Gazette is pre-selected
3. **Payments** — Stripe keys (skip and add later in Settings)
4. **Email** — Resend / Mailgun / SendGrid / SMTP (skip and add later)
5. **AI assistant** — Anthropic API key (skip and add later)
6. **Features** — choose which modules to enable

Every step is skippable. Come back to any of it in **Settings → Connections**.

## Admin dashboard
After setup, go to http://localhost:3000/admin

| Panel | What it does |
|---|---|
| Overview | Stats, recent activity, backup status |
| Features | On/off toggles for every module |
| Content | CMS pages (full editor in Phase 4) |
| Store | Products and orders (Phase 3) |
| Support | Tickets and chat logs (Phase 4/5) |
| Help centre | KB articles, feature requests |
| Changelog | Auto-logged history of all changes |
| Deploy | Backup management, one-click deploy (Phase 6) |
| Settings | Every admin-configurable variable |

## Database management
```bash
pnpm db:studio   # Open Prisma Studio — visual database browser
pnpm db:migrate  # Run migrations after schema changes
pnpm db:seed     # Re-run seed (safe to run multiple times — uses upsert)
```

## Project structure
```
app/
  (admin)/admin/     Admin dashboard pages
  (site)/            Public site (Victorian template)
  setup/             First-run setup wizard
  api/admin/         Admin API routes
  api/setup/         Setup wizard API
components/
  admin/             Admin UI components
  site/              Victorian template component
lib/
  db.ts              Prisma client singleton
  settings.ts        Read/write admin settings
  features.ts        Feature flag system
  changelog.ts       Auto-logging system
  backup.ts          Backblaze B2 backup system
  auth.ts            NextAuth configuration
prisma/
  schema.prisma      Database schema (all tables)
  seed.ts            Default data
```
