// Vercel deployment — trigger deploys via the Vercel REST API.

import { getSetting } from './settings'

async function getVercelConfig() {
  const token     = process.env.VERCEL_TOKEN     || await getSetting<string>('vercel.token',     '')
  const projectId = process.env.VERCEL_PROJECT_ID || await getSetting<string>('vercel.projectId', '')
  const teamId    = process.env.VERCEL_TEAM_ID    || await getSetting<string>('vercel.teamId',    '')
  return { token, projectId, teamId }
}

export function vercelConfigured(cfg: { token: string; projectId: string }) {
  return !!(cfg.token && cfg.projectId)
}

export async function triggerDeploy(): Promise<{ url: string; deployId: string }> {
  const cfg = await getVercelConfig()
  if (!vercelConfigured(cfg)) {
    throw new Error('Vercel is not configured. Add your token and project ID in Settings → Connections.')
  }

  const qs = cfg.teamId ? `?teamId=${cfg.teamId}` : ''
  const res = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: cfg.projectId,
      target: 'production',
      // Trigger a redeploy of the latest commit — no source upload needed
      deploymentId: undefined,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vercel API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return {
    deployId: data.id,
    url: data.url ? `https://${data.url}` : '',
  }
}

export async function getDeployStatus(deployId: string): Promise<{ state: string; url: string }> {
  const cfg = await getVercelConfig()
  if (!cfg.token) throw new Error('Vercel not configured')

  const qs = cfg.teamId ? `?teamId=${cfg.teamId}` : ''
  const res = await fetch(`https://api.vercel.com/v13/deployments/${deployId}${qs}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
  })

  if (!res.ok) throw new Error(`Vercel API error ${res.status}`)
  const data = await res.json()
  return { state: data.readyState ?? data.state ?? 'UNKNOWN', url: data.url ? `https://${data.url}` : '' }
}

export async function getLatestDeployments(limit = 5): Promise<Array<{ id: string; url: string; state: string; createdAt: number }>> {
  const cfg = await getVercelConfig()
  if (!vercelConfigured(cfg)) return []

  const qs = new URLSearchParams({ limit: String(limit), target: 'production' })
  if (cfg.teamId) qs.set('teamId', cfg.teamId)

  const res = await fetch(`https://api.vercel.com/v6/deployments?${qs}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    next: { revalidate: 30 },
  })

  if (!res.ok) return []
  const data = await res.json()
  return (data.deployments ?? []).map((d: { uid: string; url: string; readyState: string; createdAt: number }) => ({
    id:        d.uid,
    url:       d.url ? `https://${d.url}` : '',
    state:     d.readyState,
    createdAt: d.createdAt,
  }))
}
