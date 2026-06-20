'use client'

import { useState, useEffect, useRef } from 'react'

interface MediaFile {
  key: string
  url: string
  size: number
  updatedAt: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileName(key: string) {
  return key.split('/').pop() ?? key
}

export function MediaLibrary({ configured }: { configured: boolean }) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(configured)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!configured) return
    fetch('/api/admin/media')
      .then((r) => r.json())
      .then((data) => setFiles(data.files ?? []))
      .catch(() => setError('Failed to load files'))
      .finally(() => setLoading(false))
  }, [configured])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const presignRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const { uploadUrl, publicUrl, error: presignError } = await presignRes.json()
      if (presignError) throw new Error(presignError)

      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })

      const newFile: MediaFile = { key: `media/${file.name}`, url: publicUrl, size: file.size, updatedAt: new Date().toISOString() }
      setFiles((prev) => [newFile, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(key: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeleting(key)
    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      setFiles((prev) => prev.filter((f) => f.key !== key))
    } catch {
      setError('Failed to delete file')
    } finally {
      setDeleting(null)
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!configured) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-lg">
          <p className="text-sm font-semibold text-amber-800 mb-1">Cloudflare R2 not configured</p>
          <p className="text-sm text-amber-700">
            Add your R2 credentials in{' '}
            <a href="/admin/settings/connections" className="underline">Settings → Connections</a>{' '}
            to enable media storage.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Upload */}
      <div className="flex items-center gap-4">
        <label className={`inline-flex items-center gap-2 px-4 py-2 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded cursor-pointer hover:bg-[#35291C] transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? 'Uploading…' : '⬆ Upload file'}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <div key={file.key} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Preview */}
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.key) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={fileName(file.key)} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📄</span>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-gray-700 font-medium truncate" title={fileName(file.key)}>{fileName(file.key)}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(file.url)}
                  className="px-2 py-1 bg-white text-xs font-semibold rounded hover:bg-gray-100"
                >
                  {copied === file.url ? '✓ Copied' : 'Copy URL'}
                </button>
                <button
                  onClick={() => handleDelete(file.key)}
                  disabled={deleting === file.key}
                  className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === file.key ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
