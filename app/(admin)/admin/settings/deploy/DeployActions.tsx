'use client'

import { useState } from 'react'

interface Props {
  vercelConfigured: boolean
  backupOnly?: boolean
}

export function DeployActions({ vercelConfigured, backupOnly = false }: Props) {
  const [deploying, setDeploying] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url?: string; error?: string } | null>(null)
  const [backupResult, setBackupResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  async function handleDeploy() {
    setDeploying(true)
    setDeployResult(null)
    try {
      const res = await fetch('/api/admin/deploy', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setDeployResult({ error: data.error ?? 'Deploy failed' })
      else setDeployResult({ url: data.url })
    } catch {
      setDeployResult({ error: 'Network error — try again' })
    } finally {
      setDeploying(false)
    }
  }

  async function handleBackup() {
    setBackingUp(true)
    setBackupResult(null)
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setBackupResult({ error: data.error ?? 'Backup failed' })
      else { setBackupResult({ ok: true }); setTimeout(() => window.location.reload(), 1500) }
    } catch {
      setBackupResult({ error: 'Network error — try again' })
    } finally {
      setBackingUp(false)
    }
  }

  if (backupOnly) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={handleBackup}
          disabled={backingUp}
          className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {backingUp ? 'Backing up…' : 'Back up now'}
        </button>
        {backupResult?.ok && <span className="text-xs text-green-600">Backup started</span>}
        {backupResult?.error && <span className="text-xs text-red-600">{backupResult.error}</span>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={handleDeploy}
          disabled={deploying || !vercelConfigured}
          className="px-5 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deploying ? '▲ Deploying…' : '▲ Deploy to Vercel'}
        </button>
        {!vercelConfigured && (
          <p className="text-xs text-gray-400">Connect Vercel in Settings → Connections to enable one-click deploy.</p>
        )}
      </div>
      {deployResult?.url && (
        <p className="text-sm text-green-700">
          Deploy triggered!{' '}
          <a href={deployResult.url} target="_blank" rel="noopener noreferrer" className="underline">
            View on Vercel →
          </a>
        </p>
      )}
      {deployResult?.error && (
        <p className="text-sm text-red-600">{deployResult.error}</p>
      )}
    </div>
  )
}
