import { PostHog } from 'posthog-node'
import { getSetting } from './settings'

// Track the key used to create the current client so we can reinitialise if it changes.
let _client: PostHog | null = null
let _initializedWithKey = ''

async function getClient(): Promise<PostHog | null> {
  const enabled = await getSetting<boolean>('analytics.enabled', true)
  if (!enabled) return null

  const apiKey = process.env.POSTHOG_API_KEY || await getSetting<string>('analytics.posthogKey', '')
  if (!apiKey) return null

  if (_client && _initializedWithKey === apiKey) return _client

  // New key or first init — (re)create client
  if (_client) await _client.shutdown()
  const host = await getSetting<string>('analytics.posthogHost', 'https://us.i.posthog.com')
  _client = new PostHog(apiKey, { host, flushAt: 1, flushInterval: 0 })
  _initializedWithKey = apiKey
  return _client
}

export async function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = await getClient()
  if (!client) return
  client.capture({ distinctId, event, properties: properties ?? {} })
  await client.flush()
}

export async function identifyUser(
  distinctId: string,
  traits: Record<string, unknown>
) {
  const client = await getClient()
  if (!client) return
  client.identify({ distinctId, properties: traits })
  await client.flush()
}

export async function shutdownPostHog() {
  if (_client) {
    await _client.shutdown()
    _client = null
    _initializedWithKey = ''
  }
}
