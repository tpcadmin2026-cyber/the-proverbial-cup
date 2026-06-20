// Seed file — populates default settings, feature flags, setup steps, and sample data.
// Run with: pnpm db:seed

import { PrismaClient } from '@prisma/client'
import { PERMISSION_DEFINITIONS, ROLE_DEFAULTS } from '../lib/permissions'

const db = new PrismaClient()

// ── Settings ─────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = [
  // Site identity
  { key: 'site.name',          group: 'site', label: 'Site name',          helpText: 'The name of your website, shown in the browser tab and emails.', inputType: 'text',  value: '"My Site"' },
  { key: 'site.tagline',       group: 'site', label: 'Tagline',            helpText: 'A short phrase that appears under your site name.', inputType: 'text',  value: '""' },
  { key: 'site.language',      group: 'site', label: 'Language',           helpText: 'The primary language of your website.', inputType: 'select', value: '"en"', options: '[{"label":"English","value":"en"},{"label":"French","value":"fr"},{"label":"German","value":"de"}]' },
  { key: 'site.timezone',      group: 'site', label: 'Timezone',           helpText: 'Used for scheduled emails, analytics, and display dates.', inputType: 'text',  value: '"Europe/London"' },
  { key: 'site.contactEmail',  group: 'site', label: 'Contact email',      helpText: 'This email appears in your footer and receives contact form submissions.', inputType: 'email', value: '""' },
  { key: 'site.address',       group: 'site', label: 'Business address',   helpText: 'Shown in your footer and required for email compliance (CAN-SPAM / GDPR).', inputType: 'textarea', value: '""' },
  { key: 'site.copyrightText', group: 'site', label: 'Copyright text',     helpText: 'Shown at the bottom of every page.', inputType: 'text', value: '"© My Site. All rights reserved."' },
  { key: 'site.termsUrl',      group: 'site', label: 'Terms & conditions URL', helpText: 'Link to your terms of service page.', inputType: 'url', value: '"/terms"' },
  { key: 'site.privacyUrl',    group: 'site', label: 'Privacy policy URL', helpText: 'Link to your privacy policy page.', inputType: 'url', value: '"/privacy"' },
  { key: 'site.logoUrl',       group: 'site', label: 'Logo image',         helpText: 'Upload your logo. Used in emails and the admin header.', inputType: 'image', value: '""' },
  { key: 'site.faviconUrl',    group: 'site', label: 'Favicon',            helpText: 'The small icon shown in browser tabs. Should be square, at least 32×32px.', inputType: 'image', value: '""' },
  { key: 'site.social.twitter',   group: 'site', label: 'X (Twitter) URL',  helpText: 'Your Twitter / X profile URL.', inputType: 'url', value: '""' },
  { key: 'site.social.instagram', group: 'site', label: 'Instagram URL',    helpText: 'Your Instagram profile URL.', inputType: 'url', value: '""' },
  { key: 'site.social.facebook',  group: 'site', label: 'Facebook URL',     helpText: 'Your Facebook page URL.', inputType: 'url', value: '""' },

  // Design
  { key: 'design.activeTemplate',     group: 'design', label: 'Active template',        helpText: 'Which visual template your site uses.', inputType: 'select', value: '"victorian_gazette"', options: '[{"label":"Victorian Illustrated Gazette","value":"victorian_gazette"}]' },
  { key: 'design.bgColor',            group: 'design', label: 'Background colour',       helpText: 'The main background colour of your site.', inputType: 'color', value: '"#E8E6D8"' },
  { key: 'design.paperColor',         group: 'design', label: 'Page / paper colour',     helpText: 'The colour of the newspaper page surface.', inputType: 'color', value: '"transparent"' },
  { key: 'design.inkColor',           group: 'design', label: 'Ink colour',              helpText: 'The main text colour.', inputType: 'color', value: '"#1a1008"' },
  { key: 'design.accentColor',        group: 'design', label: 'Accent colour (red)',      helpText: 'Used for section labels, borders, and highlights.', inputType: 'color', value: '"#7a1c1c"' },
  { key: 'design.goldColor',          group: 'design', label: 'Gold colour',             helpText: 'Used for ornamental details and dingbats.', inputType: 'color', value: '"#8b6914"' },
  { key: 'design.linkColor',          group: 'design', label: 'Link colour',             helpText: 'Colour of clickable links.', inputType: 'color', value: '"#7a1c1c"' },
  { key: 'design.tabWidth',           group: 'design', label: 'Tab width (px)',           helpText: 'Width of the side navigation tabs in pixels.', inputType: 'number', value: '44' },
  { key: 'design.slideMs',            group: 'design', label: 'Page transition speed (ms)', helpText: 'How fast pages slide when you navigate. 500ms is the default.', inputType: 'number', value: '500' },
  { key: 'design.mastheadTitle',      group: 'masthead', label: 'Masthead title',          helpText: 'The large decorative title displayed at the top of the newspaper — the big gothic text.', inputType: 'text', value: '"My Site"' },
  { key: 'design.grain.enabled',      group: 'design', label: 'Paper grain texture',      helpText: 'Enables the paper texture effect on the background.', inputType: 'toggle', value: 'true' },
  { key: 'design.grain.baseFrequency', group: 'design', label: 'Grain frequency',         helpText: 'Controls how fine or coarse the paper grain looks. Default: 0.62.', inputType: 'number', value: '0.62' },
  { key: 'design.grain.numOctaves',   group: 'design', label: 'Grain octaves',            helpText: 'Controls the complexity of the paper grain. Default: 4.', inputType: 'number', value: '4' },
  { key: 'design.grain.slope',        group: 'design', label: 'Grain intensity',          helpText: 'How strong the grain effect is. Default: 3.2.', inputType: 'number', value: '3.2' },
  { key: 'design.grain.opacity',      group: 'design', label: 'Grain opacity',            helpText: 'How visible the grain is, from 0 (invisible) to 1 (full). Default: 0.72.', inputType: 'number', value: '0.72' },
  { key: 'design.scrollbarThumb',     group: 'design', label: 'Scrollbar colour',         helpText: 'Colour of the scrollbar thumb.', inputType: 'color', value: '"#a89060"' },
  { key: 'design.font.masthead',      group: 'design', label: 'Masthead font',            helpText: 'Font used for the large title at the top.', inputType: 'text', value: '"UnifrakturMaguntia"' },
  { key: 'design.font.headline',      group: 'design', label: 'Headline font',            helpText: 'Font used for article headlines.', inputType: 'text', value: '"Cinzel"' },
  { key: 'design.font.body',          group: 'design', label: 'Body text font',           helpText: 'Font used for article body text.', inputType: 'text', value: '"IM Fell English"' },
  { key: 'design.font.smallCaps',     group: 'design', label: 'Small caps / labels font', helpText: 'Font used for section labels and small caps text.', inputType: 'text', value: '"IM Fell English SC"' },

  // Masthead / edition
  { key: 'masthead.taglineLeft',    group: 'masthead', label: 'Tagline — left text',    helpText: 'Text on the left of the tagline row (e.g. "Price Two Pence").', inputType: 'text', value: '"PRICE TWO PENCE"' },
  { key: 'masthead.taglineCenter',  group: 'masthead', label: 'Tagline — centre ornament', helpText: 'Decorative element in the centre of the tagline row.', inputType: 'text', value: '"❧ ✦ ❧"' },
  { key: 'masthead.taglineRight',   group: 'masthead', label: 'Tagline — right text',   helpText: 'Text on the right of the tagline row (e.g. "For King & Country").', inputType: 'text', value: '"FOR KING & COUNTRY"' },
  { key: 'masthead.motto',          group: 'masthead', label: 'Motto / subtitle',        helpText: 'Your site\'s motto shown below the masthead title.', inputType: 'text', value: '"Truth, Honour, Industry"' },
  { key: 'masthead.editionDate',    group: 'masthead', label: 'Edition date',            helpText: 'Displayed date in the edition bar.', inputType: 'text', value: '"Thursday, 14th November, 1878"' },
  { key: 'masthead.volume',         group: 'masthead', label: 'Volume number',           helpText: 'Volume number shown in the edition bar.', inputType: 'text', value: '"XVI"' },
  { key: 'masthead.issueNumber',    group: 'masthead', label: 'Issue number',            helpText: 'Issue number shown in the edition bar.', inputType: 'text', value: '"841"' },
  { key: 'masthead.editionLabel',   group: 'masthead', label: 'Edition label',           helpText: 'Edition label (e.g. "London Morning Edition").', inputType: 'text', value: '"LONDON MORNING EDITION"' },
  { key: 'masthead.establishedBy',  group: 'masthead', label: 'Established text',        helpText: 'Text shown on the right of the edition bar.', inputType: 'text', value: '"Established by Royal Charter"' },

  // Email / notifications
  { key: 'email.provider',    group: 'email', label: 'Email provider',       helpText: 'Which service sends your emails.', inputType: 'select', value: '"resend"', options: '[{"label":"Resend","value":"resend"},{"label":"Mailgun","value":"mailgun"},{"label":"SendGrid","value":"sendgrid"},{"label":"SMTP","value":"smtp"}]' },
  { key: 'email.apiKey',      group: 'email', label: 'API key',              helpText: 'Your email provider\'s API key. Stored securely.', inputType: 'text', value: '""' },
  { key: 'email.fromName',    group: 'email', label: 'Sender name',          helpText: 'The name that appears in the "From" field of emails you send.', inputType: 'text', value: '"My Site"' },
  { key: 'email.fromAddress', group: 'email', label: 'Sender email address', helpText: 'The email address your messages are sent from.', inputType: 'email', value: '""' },
  { key: 'email.replyTo',     group: 'email', label: 'Reply-to address',     helpText: 'Replies to your emails will go to this address.', inputType: 'email', value: '""' },
  { key: 'email.footer',      group: 'email', label: 'Email footer text',    helpText: 'Shown at the bottom of every email you send.', inputType: 'textarea', value: '"© The Victorian Illustrated Gazette · Unsubscribe · Privacy Policy"' },

  // Payments
  { key: 'payments.currency',      group: 'payments', label: 'Currency',             helpText: 'The currency used for all prices. Use a 3-letter code, e.g. GBP, USD, EUR.', inputType: 'text', value: '"GBP"' },
  { key: 'payments.freeShipping',  group: 'payments', label: 'Free shipping threshold', helpText: 'Orders above this amount get free shipping. Set to 0 to disable.', inputType: 'number', value: '0' },
  { key: 'payments.taxRate',       group: 'payments', label: 'Default tax rate (%)', helpText: 'The default tax percentage applied to orders.', inputType: 'number', value: '20' },

  // Subscriptions
  { key: 'subscriptions.pauseMaxDays',      group: 'subscriptions', label: 'Maximum pause duration (days)', helpText: 'The longest a subscriber can pause their subscription. 0 = unlimited.', inputType: 'number', value: '0' },
  { key: 'subscriptions.winback30Subject',  group: 'subscriptions', label: 'Win-back email subject (day 30)', helpText: 'Subject line of the email sent 30 days after a cancellation.', inputType: 'text', value: '"We miss you at the Gazette — a word from the Editor"' },
  { key: 'subscriptions.winback60Subject',  group: 'subscriptions', label: 'Win-back email subject (day 60)', helpText: 'Subject line of the email sent 60 days after a cancellation.', inputType: 'text', value: '"One final dispatch from the Gazette"' },

  // Cloudflare R2 media storage
  { key: 'r2.accountId',   group: 'r2', label: 'Cloudflare account ID',   helpText: 'Your Cloudflare account ID. Found in the Cloudflare dashboard sidebar.', inputType: 'text', value: '""' },
  { key: 'r2.accessKeyId', group: 'r2', label: 'R2 access key ID',        helpText: 'The access key ID for your R2 API token. Created in Cloudflare → R2 → Manage R2 API tokens.', inputType: 'text', value: '""' },
  { key: 'r2.secretKey',   group: 'r2', label: 'R2 secret access key',    helpText: 'The secret key for your R2 API token. Only shown once when you create the token.', inputType: 'text', value: '""' },
  { key: 'r2.bucket',      group: 'r2', label: 'R2 bucket name',          helpText: 'The name of your R2 bucket where media files are stored.', inputType: 'text', value: '""' },
  { key: 'r2.publicUrl',   group: 'r2', label: 'Public media URL',        helpText: 'The public base URL for serving files (e.g. your custom domain or the R2 dev URL). No trailing slash.', inputType: 'text', value: '""' },

  // Vercel deployment
  { key: 'vercel.token',     group: 'vercel', label: 'Vercel deploy token',  helpText: 'A Vercel API token with deploy permissions. Created in Vercel → Account Settings → Tokens.', inputType: 'text', value: '""' },
  { key: 'vercel.projectId', group: 'vercel', label: 'Vercel project ID',    helpText: 'The ID of your Vercel project. Found in Vercel → Project Settings → General.', inputType: 'text', value: '""' },
  { key: 'vercel.teamId',    group: 'vercel', label: 'Vercel team ID',       helpText: 'Your Vercel team ID. Leave blank if deploying under a personal account.', inputType: 'text', value: '""' },

  // Backblaze B2 credentials (stored here for the connections panel; backup.ts reads env vars)
  { key: 'b2.keyId',      group: 'b2', label: 'B2 application key ID',   helpText: 'Your Backblaze B2 application key ID. Found in Backblaze → App Keys.', inputType: 'text', value: '""' },
  { key: 'b2.appKey',     group: 'b2', label: 'B2 application key',      helpText: 'Your Backblaze B2 application key. Only shown once when created.', inputType: 'text', value: '""' },
  { key: 'b2.bucket',     group: 'b2', label: 'B2 bucket name',          helpText: 'The name of your B2 bucket where backups are stored.', inputType: 'text', value: '""' },
  { key: 'b2.endpoint',   group: 'b2', label: 'B2 S3-compatible endpoint', helpText: 'The S3-compatible endpoint URL for your B2 bucket (e.g. https://s3.us-west-004.backblazeb2.com).', inputType: 'text', value: '""' },

  // Stripe secret key (public key + webhook secret already in stripe group)
  { key: 'stripe.secretKey', group: 'stripe', label: 'Stripe secret key', helpText: 'Your Stripe secret key (starts with sk_). Keep this private. Found in Stripe Dashboard → Developers → API Keys.', inputType: 'text', value: '""' },

  // Backups
  { key: 'backups.provider',         group: 'backups', label: 'Backup storage provider', helpText: 'Where backups are stored.', inputType: 'select', value: '"backblaze_b2"', options: '[{"label":"Backblaze B2","value":"backblaze_b2"}]' },
  { key: 'backups.retainDaily',      group: 'backups', label: 'Daily backups to keep',   helpText: 'How many daily backups to keep before deleting old ones.', inputType: 'number', value: '30' },
  { key: 'backups.retainWeekly',     group: 'backups', label: 'Weekly backups to keep',  helpText: 'How many weekly backups to keep.', inputType: 'number', value: '12' },
  { key: 'backups.retainMonthly',    group: 'backups', label: 'Monthly backups to keep', helpText: 'How many monthly backups to keep.', inputType: 'number', value: '12' },
  { key: 'backups.notifyEmail',      group: 'backups', label: 'Backup notification email', helpText: 'Email address to notify when a backup completes or fails.', inputType: 'email', value: '""' },
  { key: 'backups.onDeploy',         group: 'backups', label: 'Backup on deploy',         helpText: 'Automatically create a backup before each deployment.', inputType: 'toggle', value: 'true' },
  { key: 'backups.onContentSave',    group: 'backups', label: 'Backup on content save',   helpText: 'Automatically create a backup when content is published.', inputType: 'toggle', value: 'true' },
  { key: 'backups.onSettingsChange', group: 'backups', label: 'Backup on settings change', helpText: 'Automatically create a backup when settings are saved.', inputType: 'toggle', value: 'false' },

  // AI chat
  { key: 'ai.enabled',              group: 'ai', label: 'Enable AI chat widget',   helpText: 'Show the chat widget on your site so visitors can ask questions.', inputType: 'toggle', value: 'false' },
  { key: 'ai.apiKey',               group: 'ai', label: 'Anthropic API key',        helpText: 'Your Anthropic API key from console.anthropic.com. Leave blank to use the ANTHROPIC_API_KEY environment variable instead.', inputType: 'text', value: '""' },
  { key: 'ai.model',                group: 'ai', label: 'AI model',                 helpText: 'Which Claude model powers the chat. Haiku is faster and cheaper; Sonnet is more capable.', inputType: 'select', value: '"claude-haiku-4-5-20251001"', options: '[{"label":"Claude Haiku (fast, economical)","value":"claude-haiku-4-5-20251001"},{"label":"Claude Sonnet (more capable)","value":"claude-sonnet-4-6"}]' },
  { key: 'ai.personaName',          group: 'ai', label: 'Assistant name',          helpText: 'The name your AI assistant introduces itself as.', inputType: 'text', value: '"Cornelius"' },
  { key: 'ai.systemPrompt',         group: 'ai', label: 'Personality instructions', helpText: 'Instructions that shape how the assistant speaks and behaves. Write in plain English.', inputType: 'textarea', value: '"You are Cornelius, a distinguished Victorian gentleman and knowledgeable guide to The Victorian Illustrated Gazette — a premium coffee subscription service. Your role is to assist patrons with questions about their subscriptions, orders, account management, and our coffee selection.\\n\\nSpeak with warmth, wit, and period-appropriate charm — but always be clear, accurate, and genuinely helpful above all else. Use light Victorian flourishes without being obscure or verbose. Keep answers concise.\\n\\nIf a visitor asks something outside your knowledge or that requires account-specific detail, invite them to contact the editorial desk via the Help Desk or Contact page. Do not invent prices, product details, or policies — if uncertain, say so gracefully and direct them to the appropriate page."' },
  { key: 'ai.historyLength',        group: 'ai', label: 'Conversation memory (messages)', helpText: 'How many past messages the assistant remembers per conversation.', inputType: 'number', value: '10' },
  { key: 'ai.injectKnowledgeBase',  group: 'ai', label: 'Include help articles as context', helpText: 'Automatically feeds your published help articles to the assistant so it can answer common questions accurately.', inputType: 'toggle', value: 'true' },
  { key: 'ai.widgetPosition',       group: 'ai', label: 'Widget position',          helpText: 'Where the chat button appears on the page.', inputType: 'select', value: '"bottom-right"', options: '[{"label":"Bottom right","value":"bottom-right"},{"label":"Bottom left","value":"bottom-left"}]' },
  { key: 'ai.welcomeMessage',       group: 'ai', label: 'Welcome message',          helpText: 'The first message visitors see when they open the chat.', inputType: 'textarea', value: '"Good day! I am Cornelius, your guide to all matters of the Gazette. How may I be of service?"' },
  { key: 'ai.offlineMessage',       group: 'ai', label: 'Offline message',          helpText: 'Shown when the AI service is unavailable.', inputType: 'text', value: '"Our correspondent is temporarily indisposed. Please try again shortly."' },

  // Analytics
  { key: 'analytics.enabled',       group: 'analytics', label: 'Enable analytics',        helpText: 'Turn PostHog tracking on or off. Disabling stops all event capture without removing your API key.', inputType: 'toggle', value: 'true' },
  { key: 'analytics.posthogKey',    group: 'analytics', label: 'PostHog project API key', helpText: 'Your PostHog project API key. Found in PostHog → Project Settings → Project API Key. Starts with "phc_".', inputType: 'text', value: '""' },
  { key: 'analytics.posthogHost',   group: 'analytics', label: 'PostHog host',             helpText: 'Leave as the default unless you self-host PostHog.', inputType: 'text', value: '"https://us.i.posthog.com"' },

  // Maintenance
  { key: 'maintenance.enabled',        group: 'maintenance', label: 'Maintenance mode',           helpText: 'When on, your site shows a maintenance message instead of normal content. Admins can still log in.', inputType: 'toggle', value: 'false' },
  { key: 'maintenance.message',        group: 'maintenance', label: 'Maintenance message',        helpText: 'The message shown to visitors during maintenance.', inputType: 'textarea', value: '"The Gazette is temporarily indisposed for essential improvements. We shall return directly."' },
  { key: 'maintenance.private_mode',   group: 'maintenance', label: 'Private / coming-soon mode', helpText: 'When on, visitors who are not logged in see a coming-soon page instead of the site. Useful before launch.', inputType: 'toggle', value: 'false' },
  { key: 'maintenance.coming_soon_title',   group: 'maintenance', label: 'Coming-soon heading',  helpText: 'The main headline shown on the coming-soon page.', inputType: 'text', value: '"Something Rather Splendid Is Coming"' },
  { key: 'maintenance.coming_soon_message', group: 'maintenance', label: 'Coming-soon message',  helpText: 'The body text shown on the coming-soon page.', inputType: 'textarea', value: '"We are putting the finishing touches on something special. Check back soon."' },

  // User accounts
  { key: 'auth.selfRegistration',   group: 'auth', label: 'Allow self-registration', helpText: 'Let new visitors create their own accounts.', inputType: 'toggle', value: 'true' },
  { key: 'auth.emailVerification',  group: 'auth', label: 'Require email verification', helpText: 'New accounts must verify their email before they can log in.', inputType: 'toggle', value: 'true' },
  { key: 'auth.magicLink',          group: 'auth', label: 'Enable magic link login',  helpText: 'Let users log in by clicking a link sent to their email, with no password needed.', inputType: 'toggle', value: 'true' },
  { key: 'auth.googleOAuth',        group: 'auth', label: 'Enable Google sign-in',    helpText: 'Let users sign in with their Google account.', inputType: 'toggle', value: 'false' },
  { key: 'auth.sessionDays',        group: 'auth', label: 'Stay logged in for (days)', helpText: 'How many days before users are asked to log in again.', inputType: 'number', value: '30' },

  // Changelog
  { key: 'changelog.public',        group: 'changelog', label: 'Public changelog page', helpText: 'Show a public changelog on your website so subscribers can see what\'s new.', inputType: 'toggle', value: 'false' },
  { key: 'changelog.trackDeploys',  group: 'changelog', label: 'Log deployments',       helpText: 'Automatically record an entry each time the site is deployed.', inputType: 'toggle', value: 'true' },
  { key: 'changelog.trackFeatures', group: 'changelog', label: 'Log feature toggles',   helpText: 'Automatically record when you turn features on or off.', inputType: 'toggle', value: 'true' },
  { key: 'changelog.trackContent',  group: 'changelog', label: 'Log content saves',     helpText: 'Automatically record when content is published or updated.', inputType: 'toggle', value: 'true' },
  { key: 'changelog.trackSettings', group: 'changelog', label: 'Log settings changes',  helpText: 'Automatically record when settings are saved.', inputType: 'toggle', value: 'true' },

  // Newsletter
  { key: 'newsletter.heading',    group: 'newsletter', label: 'Newsletter page heading',    helpText: 'The main headline on the newsletter sign-up page.', inputType: 'text',     value: '"Despatches from the Gazette"' },
  { key: 'newsletter.subheading', group: 'newsletter', label: 'Newsletter page subheading', helpText: 'The supporting text beneath the heading.', inputType: 'textarea', value: '"Receive the finest coffee dispatches, seasonal offerings, and editorial intelligence directly to your correspondence box."' },
  { key: 'newsletter.successMessage', group: 'newsletter', label: 'Sign-up success message', helpText: 'Shown to the reader after they submit the form.', inputType: 'text', value: '"Splendid! You are now enrolled in our correspondence list."' },
  { key: 'newsletter.requireConfirm', group: 'newsletter', label: 'Require email confirmation', helpText: 'Send a confirmation email before adding them to the list.', inputType: 'toggle', value: 'true' },

  // Waitlist
  { key: 'waitlist.heading',       group: 'waitlist', label: 'Waitlist page heading',    helpText: 'The main headline on the waitlist page.', inputType: 'text',     value: '"Secure Your Place at the Gazette"' },
  { key: 'waitlist.subheading',    group: 'waitlist', label: 'Waitlist page subheading', helpText: 'The supporting text beneath the heading.', inputType: 'textarea', value: '"We are preparing something rather splendid. Leave your card and we shall write to you the moment subscriptions open."' },
  { key: 'waitlist.showPosition',  group: 'waitlist', label: 'Show queue position',     helpText: 'Show the reader their position in the waitlist after they sign up.', inputType: 'toggle', value: 'true' },
  { key: 'waitlist.successMessage', group: 'waitlist', label: 'Sign-up success message', helpText: 'Shown after a successful waitlist submission.', inputType: 'text', value: '"Your card has been received. We shall be in correspondence directly."' },

  // Contact
  { key: 'contact.heading',    group: 'contact', label: 'Contact page heading',    helpText: 'The main headline on the contact page.', inputType: 'text',     value: '"Correspond with the Gazette"' },
  { key: 'contact.subheading', group: 'contact', label: 'Contact page subheading', helpText: 'The supporting text beneath the heading.', inputType: 'textarea', value: '"Address your queries to our editorial desk. We endeavour to reply within two working days."' },
  { key: 'contact.successMessage', group: 'contact', label: 'Submission success message', helpText: 'Shown after a contact form is submitted.', inputType: 'text', value: '"Your message has been received. We shall be in correspondence directly."' },

  // Help centre
  { key: 'help.heading',    group: 'help', label: 'Help centre heading',    helpText: 'The main headline on the public help centre page.', inputType: 'text', value: '"The Gazette Help Desk"' },
  { key: 'help.subheading', group: 'help', label: 'Help centre subheading', helpText: 'Supporting text on the help centre page.', inputType: 'text', value: '"Browse our library of guidance below, or submit a support enquiry if you cannot find what you seek."' },

  // Quiz
  { key: 'quiz.heading',       group: 'quiz', label: 'Quiz page heading',      helpText: 'The main headline on the quiz page.', inputType: 'text',     value: '"Find Your Perfect Subscription"' },
  { key: 'quiz.subheading',    group: 'quiz', label: 'Quiz page subheading',   helpText: 'Supporting text beneath the quiz heading.', inputType: 'textarea', value: '"Answer a few brief questions and our editorial team shall recommend the finest Gazette subscription for your particular tastes."' },
  { key: 'quiz.resultHeading', group: 'quiz', label: 'Result page heading',    helpText: 'Heading shown after the quiz is completed.', inputType: 'text', value: '"Our Recommendation for You"' },
  { key: 'quiz.resultSubtext', group: 'quiz', label: 'Result page subtext',    helpText: 'Supporting text shown with the recommendation.', inputType: 'textarea', value: '"Based upon your answers, we believe the following subscription would suit you admirably."' },

  // Support tickets
  { key: 'support.heading',        group: 'support', label: 'Support page heading',    helpText: 'The main headline on the support page.', inputType: 'text', value: '"Submit a Support Request"' },
  { key: 'support.subheading',     group: 'support', label: 'Support page subheading', helpText: 'Supporting text beneath the heading.', inputType: 'textarea', value: '"Our team endeavours to respond within two working days."' },
  { key: 'support.successMessage', group: 'support', label: 'Submission success message', helpText: 'Shown after a request is submitted.', inputType: 'text', value: '"Your request has been received. We shall be in correspondence shortly."' },

  // Feature requests
  { key: 'requests.heading',    group: 'requests', label: 'Feature requests heading',    helpText: 'The main headline on the feature requests page.', inputType: 'text', value: '"Ideas & Suggestions"' },
  { key: 'requests.subheading', group: 'requests', label: 'Feature requests subheading', helpText: 'Supporting text on the feature requests page.', inputType: 'textarea', value: '"Share your ideas and vote for what we should build next. We read every suggestion."' },

  // Legal
  { key: 'legal.termsContent',   group: 'legal', label: 'Terms & conditions',  helpText: 'The full text of your terms of service. Use blank lines to separate paragraphs.', inputType: 'textarea', value: '"Replace this with your Terms & Conditions. Consult a legal professional to ensure your terms comply with applicable laws.\n\nLast updated: [Date]\n\nBy using this website, you agree to these terms."' },
  { key: 'legal.privacyContent', group: 'legal', label: 'Privacy policy',      helpText: 'The full text of your privacy policy. Use blank lines to separate paragraphs.', inputType: 'textarea', value: '"Replace this with your Privacy Policy. Consult a legal professional to ensure your policy complies with applicable laws (GDPR, CCPA, etc.).\n\nLast updated: [Date]\n\nWe take your privacy seriously."' },

  // Stripe
  { key: 'stripe.publicKey',      group: 'stripe', label: 'Stripe publishable key', helpText: 'Your Stripe publishable key (starts with pk_). Found in Stripe Dashboard → Developers → API Keys.', inputType: 'text', value: '""' },
  { key: 'stripe.webhookSecret',  group: 'stripe', label: 'Stripe webhook secret',  helpText: 'The signing secret for your Stripe webhook endpoint. Found in Stripe Dashboard → Webhooks.', inputType: 'text', value: '""' },
  { key: 'stripe.successUrl',     group: 'stripe', label: 'Payment success URL',    helpText: 'Where Stripe redirects the customer after a successful payment.', inputType: 'text', value: '"/account?payment=success"' },
  { key: 'stripe.cancelUrl',      group: 'stripe', label: 'Payment cancelled URL',  helpText: 'Where Stripe redirects the customer if they cancel the payment.', inputType: 'text', value: '"/pricing"' },
]

// ── Feature Flags ─────────────────────────────────────────────────────────────
// enabled: true = on by default for fresh installs; false = off until admin enables
const DEFAULT_FLAGS = [
  { key: 'subscriptions',     label: 'Subscriptions',           category: 'commerce',    description: 'Coffee subscription plans — let customers subscribe for regular deliveries.',           enabled: true  },
  { key: 'contact_form',      label: 'Contact form',            category: 'engagement',  description: 'A simple form for visitors to send you a message.',                                     enabled: true  },
  { key: 'newsletter',        label: 'Newsletter sign-up',      category: 'engagement',  description: 'A sign-up form to collect email addresses for your newsletter.',                         enabled: true  },
  { key: 'waitlist',          label: 'Waitlist',                category: 'engagement',  description: 'A waitlist form for visitors to join before you launch.',                               enabled: true  },
  { key: 'knowledge_base',    label: 'Knowledge base',          category: 'support',     description: 'A searchable library of help articles your customers can browse themselves.',            enabled: true  },
  { key: 'support_tickets',   label: 'Support tickets',         category: 'support',     description: 'A support inbox where customers can submit questions and track their responses.',        enabled: true  },
  { key: 'analytics',         label: 'Analytics',               category: 'general',     description: 'Visitor stats, revenue tracking, and conversion funnels via PostHog.',                  enabled: true  },
  { key: 'blog',              label: 'Blog / Journal',          category: 'engagement',  description: 'A public blog for publishing posts, guides, and editorial content.',                      enabled: true  },
  // Off by default — require extra setup or deliberate opt-in
  { key: 'ecommerce',         label: 'Online shop',             category: 'commerce',    description: 'Sell individual products, gift sets, and equipment through your site.',                 enabled: false },
  { key: 'ai_chat',           label: 'AI chat assistant',       category: 'engagement',  description: 'An AI-powered chat widget that answers visitor questions and escalates to your support team.', enabled: false },
  { key: 'quiz',              label: 'Recommendation quiz',     category: 'engagement',  description: 'A short quiz that recommends the right subscription or product for each visitor.',      enabled: false },
  { key: 'feature_requests',  label: 'Feature requests',        category: 'support',     description: 'A public board where customers can suggest ideas and upvote each other\'s suggestions.', enabled: false },
  { key: 'corporate_gifting', label: 'Corporate gifting',       category: 'commerce',    description: 'A self-serve dashboard for businesses to manage Gazette subscriptions as gifts.',        enabled: false },
  { key: 'reading_room',      label: 'Members\' reading room',  category: 'engagement',  description: 'A private section with exclusive long-form content, only available to subscribers.',    enabled: false },
]

// ── Setup steps ───────────────────────────────────────────────────────────────
const SETUP_STEPS = [
  { stepKey: 'site_identity', label: 'Site identity',    order: 1 },
  { stepKey: 'template',      label: 'Choose a template', order: 2 },
  { stepKey: 'stripe',        label: 'Payments (Stripe)', order: 3 },
  { stepKey: 'email',         label: 'Email delivery',   order: 4 },
  { stepKey: 'anthropic',     label: 'AI assistant',     order: 5 },
  { stepKey: 'features',      label: 'Choose features',  order: 6 },
]

// ── Default pause reminders ───────────────────────────────────────────────────
const PAUSE_REMINDERS = [
  { daysBeforeResume: 14, order: 1, subject: 'Your Gazette pause ends in a fortnight', bodyText: 'Dear Subscriber,\n\nWe write to remind you that your subscription pause concludes in a fortnight\'s time, on {resume_date}. Your next Gazette dispatch shall resume thereafter.\n\nShould you wish to extend your pause or cancel entirely, you may do so at the link below.\n\nYours faithfully,\nThe Gazette' },
  { daysBeforeResume: 7,  order: 2, subject: 'Your Gazette subscription resumes in one week', bodyText: 'Dear Subscriber,\n\nA week remains before your Gazette subscription resumes on {resume_date}.\n\nWe look forward to resuming your regular dispatch of fine coffees.\n\nYours faithfully,\nThe Gazette' },
  { daysBeforeResume: 3,  order: 3, subject: 'Three days until your next Gazette dispatch', bodyText: 'Dear Subscriber,\n\nThree days hence your Gazette subscription shall resume, and your next selection of coffees shall be despatched without delay.\n\nYours faithfully,\nThe Gazette' },
  { daysBeforeResume: 0,  order: 4, subject: 'Your subscription resumes today', bodyText: 'Dear Subscriber,\n\nGood news — your Gazette subscription resumes today. Your next dispatch is already being prepared with the customary attention to quality.\n\nYours faithfully,\nThe Gazette' },
]

// ── Default cancel reasons ─────────────────────────────────────────────────────
const CANCEL_REASONS = [
  { label: 'Too expensive',        order: 1 },
  { label: 'Taking a break',       order: 2 },
  { label: 'Moving away',          order: 3 },
  { label: 'Didn\'t use it enough', order: 4 },
  { label: 'Other',                order: 5, allowFreeText: true },
]

// ── Sample products ───────────────────────────────────────────────────────────
const SAMPLE_PRODUCTS = [
  {
    slug: 'morning-dispatch-blend',
    name: 'The Morning Dispatch Blend',
    description: 'A robust, full-bodied blend crafted for the discerning correspondent who requires both clarity of mind and warmth of spirit before the day\'s dispatches. Notes of dark chocolate, toasted walnut, and a lingering finish of dried fig.',
    priceInCents: 1450,
    compareAtCents: 1800,
    displayOrder: 1,
    visible: true,
  },
  {
    slug: 'correspondents-single-origin',
    name: 'The Correspondent\'s Single Origin',
    description: 'A single-origin Ethiopian coffee of exceptional provenance, grown at altitude and processed with remarkable care. Vivid notes of bergamot, jasmine, and stone fruit — best enjoyed without adulteration.',
    priceInCents: 1800,
    displayOrder: 2,
    visible: true,
  },
  {
    slug: 'editors-reserve-espresso',
    name: 'The Editor\'s Reserve Espresso',
    description: 'Blended expressly for espresso preparation. Rich crema, intense aroma, and a complexity that rewards the patient observer. Notes of caramel, dark cherry, and a finish of fine cocoa.',
    priceInCents: 1650,
    displayOrder: 3,
    visible: true,
  },
  {
    slug: 'gazette-tea-service',
    name: 'Gazette Afternoon Tea Selection',
    description: 'For those occasions when coffee will not suffice. A curated selection of four fine teas: a robust Assam for morning, a delicate Darjeeling for afternoon, a fragrant Earl Grey, and a calming chamomile for evenings.',
    priceInCents: 2200,
    displayOrder: 4,
    visible: true,
  },
  {
    slug: 'ceramic-press-pot',
    name: 'Victorian Ceramic Press Pot',
    description: 'A ceramic French press of uncommon elegance, inspired by the ceramics of the Victorian period. Holds four generous cups. Presented in a gift box suitable for distinguished presentation.',
    priceInCents: 4500,
    displayOrder: 5,
    visible: true,
  },
]

async function main() {
  console.log('Seeding database…')

  // Settings
  for (const s of DEFAULT_SETTINGS) {
    await db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }
  console.log(`✓ ${DEFAULT_SETTINGS.length} settings`)

  // Feature flags
  for (const f of DEFAULT_FLAGS) {
    await db.featureFlag.upsert({
      where: { key: f.key },
      update: {},
      create: f,
    })
  }
  console.log(`✓ ${DEFAULT_FLAGS.length} feature flags`)

  // Setup steps
  for (const step of SETUP_STEPS) {
    await db.setupStep.upsert({
      where: { stepKey: step.stepKey },
      update: {},
      create: step,
    })
  }
  console.log(`✓ ${SETUP_STEPS.length} setup steps`)

  // Pause reminders
  await db.pauseReminder.deleteMany()
  await db.pauseReminder.createMany({ data: PAUSE_REMINDERS })
  console.log(`✓ ${PAUSE_REMINDERS.length} pause reminders`)

  // Cancel reasons
  await db.cancelReason.deleteMany()
  await db.cancelReason.createMany({ data: CANCEL_REASONS })
  console.log(`✓ ${CANCEL_REASONS.length} cancel reasons`)

  // Permissions — upsert all definitions
  for (const p of PERMISSION_DEFINITIONS) {
    await db.permission.upsert({
      where:  { key: p.key },
      update: { label: p.label, description: p.description, category: p.category },
      create: p,
    })
  }
  console.log(`✓ ${PERMISSION_DEFINITIONS.length} permissions`)

  // Role permissions — seed defaults for each configurable role
  const allPermissions = await db.permission.findMany()
  const permMap = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]))

  for (const [role, grantedKeys] of Object.entries(ROLE_DEFAULTS)) {
    if (role === 'master_admin') continue // master_admin is always unrestricted, no DB rows needed
    for (const perm of allPermissions) {
      const granted = grantedKeys.includes(perm.key as any)
      await db.rolePermission.upsert({
        where:  { role_permissionId: { role, permissionId: perm.id } },
        update: {}, // don't overwrite admin customisations on re-seed
        create: { role, permissionId: perm.id, granted },
      })
    }
  }
  console.log(`✓ Role permissions seeded for admin, manager, employee`)

  // Sample products — only seed if none exist yet
  const existingProducts = await db.product.count()
  if (existingProducts === 0) {
    for (const p of SAMPLE_PRODUCTS) {
      await db.product.create({ data: p })
    }
    console.log(`✓ ${SAMPLE_PRODUCTS.length} sample products`)
  } else {
    console.log(`✓ Products already exist — skipped`)
  }

  // Sample KB categories + articles — only seed if none exist yet
  const existingKbCats = await db.kbCategory.count()
  if (existingKbCats === 0) {
    const subscriptionsCat = await db.kbCategory.create({
      data: { name: 'Subscriptions', slug: 'subscriptions', description: 'Managing your coffee subscription.', order: 1 },
    })
    const ordersCat = await db.kbCategory.create({
      data: { name: 'Orders & Delivery', slug: 'orders-delivery', description: 'Your orders, shipping, and delivery information.', order: 2 },
    })
    const accountCat = await db.kbCategory.create({
      data: { name: 'Your Account', slug: 'your-account', description: 'Managing your account and profile.', order: 3 },
    })

    await db.kbArticle.createMany({
      data: [
        {
          categoryId: subscriptionsCat.id,
          title: 'How do I pause my subscription?',
          slug: 'how-to-pause-subscription',
          body: 'You may pause your subscription at any time from your account portal.\n\n1. Sign in to your account at /account\n2. Navigate to the **Subscription** tab\n3. Select **Pause subscription**\n4. Choose your desired return date using the calendar\n5. Confirm the pause\n\nYour subscription will remain paused until the selected date, at which point it will resume automatically. You will receive a reminder by post a fortnight before your subscription resumes.',
          published: true,
        },
        {
          categoryId: subscriptionsCat.id,
          title: 'How do I cancel my subscription?',
          slug: 'how-to-cancel-subscription',
          body: 'We are sorry to hear you wish to depart. You may cancel at any time from your account portal.\n\n1. Sign in to your account at /account\n2. Navigate to the **Subscription** tab\n3. Select **Cancel subscription**\n4. Select a reason for your cancellation\n5. Confirm the cancellation\n\nYour subscription will be cancelled immediately. You will retain access until the end of your current billing period. You are welcome to re-subscribe at any time.',
          published: true,
        },
        {
          categoryId: subscriptionsCat.id,
          title: 'Can I change my subscription plan?',
          slug: 'change-subscription-plan',
          body: 'At present, to change your subscription plan please contact our editorial desk via the contact form. We will make the adjustment promptly and confirm the change by correspondence.\n\nIn a future edition of the Gazette platform, self-service plan changes will be available directly from your account portal.',
          published: true,
        },
        {
          categoryId: ordersCat.id,
          title: 'When will my order be dispatched?',
          slug: 'order-dispatch-times',
          body: 'Orders are typically despatched within 1–2 working days of receipt. You will receive a despatch notification by correspondence once your parcel is on its way.\n\nSubscription boxes are despatched on a fixed schedule each month. Your welcome despatch will be sent within 3–5 working days of subscribing.',
          published: true,
        },
        {
          categoryId: ordersCat.id,
          title: 'What are the delivery options?',
          slug: 'delivery-options',
          body: 'We currently offer the following delivery methods:\n\n- **Standard (3–5 working days)** — for domestic orders\n- **Express (next working day)** — for orders placed before 1pm\n- **International** — delivery times vary by destination\n\nFree standard delivery is available on qualifying orders. Please refer to our shipping policy for full details.',
          published: true,
        },
        {
          categoryId: accountCat.id,
          title: 'How do I update my email address?',
          slug: 'update-email-address',
          body: 'To update your email address:\n\n1. Sign in to your account at /account\n2. Navigate to the **Profile** tab\n3. Update the email address field\n4. Save your changes\n\nA verification link will be sent to your new address. Your email address will not change until you have verified the new one.',
          published: true,
        },
        {
          categoryId: accountCat.id,
          title: 'How do I reset my password?',
          slug: 'reset-password',
          body: 'If you have forgotten your password:\n\n1. Visit the sign-in page at /login\n2. Select **Forgot your password?**\n3. Enter your email address\n4. A password reset link will be sent to your correspondence address\n5. Follow the link and set a new password\n\nThe reset link expires after 1 hour. If you do not receive the email within a few minutes, please check your correspondence junk folder.',
          published: true,
        },
      ],
    })
    console.log(`✓ Sample KB categories and articles seeded`)
  } else {
    console.log(`✓ KB categories already exist — skipped`)
  }

  // Default nav items — only seed if none exist
  const existingNavItems = await db.navItem.count()
  if (existingNavItems === 0) {
    await db.navItem.createMany({
      data: [
        { label: 'Subscribe',  numeral: '★',  href: '/pricing',    navOrder: 10, visible: true  },
        { label: 'Our Shop',   numeral: '⊡',  href: '/shop',       navOrder: 20, visible: true  },
        { label: 'Help Desk',  numeral: '?',  href: '/help',       navOrder: 30, visible: true  },
        { label: 'Contact Us', numeral: '✉',  href: '/contact',    navOrder: 40, visible: false },
        { label: 'Newsletter', numeral: '◎',  href: '/newsletter', navOrder: 50, visible: false },
      ],
    })
    console.log('✓ Default nav items seeded')
  } else {
    console.log('✓ Nav items already exist — skipped')
  }

  // Sample quiz questions — only seed if none exist
  const existingQuestions = await db.quizQuestion.count()
  if (existingQuestions === 0) {
    const q1 = await db.quizQuestion.create({
      data: { text: 'How do you take your coffee?', order: 1, active: true },
    })
    await db.quizAnswer.createMany({
      data: [
        { questionId: q1.id, text: 'Black — pure and unadulterated', order: 1, matchRules: JSON.stringify({ planTags: ['editor', 'proprietor'] }) },
        { questionId: q1.id, text: 'With milk or cream', order: 2, matchRules: JSON.stringify({ planTags: ['correspondent', 'editor'] }) },
        { questionId: q1.id, text: 'I prefer tea on occasion', order: 3, matchRules: JSON.stringify({ planTags: ['correspondent'] }) },
        { questionId: q1.id, text: 'Espresso-based drinks', order: 4, matchRules: JSON.stringify({ planTags: ['editor', 'proprietor'] }) },
      ],
    })
    const q2 = await db.quizQuestion.create({
      data: { text: 'How often do you drink coffee?', order: 2, active: true },
    })
    await db.quizAnswer.createMany({
      data: [
        { questionId: q2.id, text: 'Once a day or less', order: 1, matchRules: JSON.stringify({ planTags: ['correspondent'] }) },
        { questionId: q2.id, text: 'Two or three cups a day', order: 2, matchRules: JSON.stringify({ planTags: ['editor'] }) },
        { questionId: q2.id, text: 'Four or more cups — coffee is life', order: 3, matchRules: JSON.stringify({ planTags: ['proprietor'] }) },
      ],
    })
    const q3 = await db.quizQuestion.create({
      data: { text: 'What matters most in a coffee subscription?', order: 3, active: true },
    })
    await db.quizAnswer.createMany({
      data: [
        { questionId: q3.id, text: 'Value — I want more for less', order: 1, matchRules: JSON.stringify({ planTags: ['correspondent'] }) },
        { questionId: q3.id, text: 'Variety — I want to explore', order: 2, matchRules: JSON.stringify({ planTags: ['editor'] }) },
        { questionId: q3.id, text: 'Premium quality above all else', order: 3, matchRules: JSON.stringify({ planTags: ['proprietor'] }) },
      ],
    })
    console.log('✓ Sample quiz questions seeded')
  } else {
    console.log('✓ Quiz questions already exist — skipped')
  }

  console.log('\nSeed complete.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
