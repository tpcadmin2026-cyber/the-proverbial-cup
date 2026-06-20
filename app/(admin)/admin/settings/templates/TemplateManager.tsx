'use client'

import { useState, useRef } from 'react'

interface ImportResult {
  imported: string[]
}

export function TemplateManager() {
  const [exporting, setExporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [previewMeta, setPreviewMeta] = useState<{ name: string; description: string; generatedAt: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/templates/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const cd = res.headers.get('content-disposition') ?? ''
      const match = cd.match(/filename="([^"]+)"/)
      const filename = match?.[1] ?? 'template.json'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  function handleFileSelect(file: File) {
    setImportFile(file)
    setImportResult(null)
    setImportError('')
    setPreviewMeta(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!data.templateVersion) throw new Error('Not a template file')
        setPreviewMeta({
          name: data.meta?.name ?? 'Unknown',
          description: data.meta?.description ?? '',
          generatedAt: data.generatedAt ?? '',
        })
      } catch {
        setImportError('This does not appear to be a valid template file.')
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    setImportError('')
    setImportResult(null)
    try {
      const text = await importFile.text()
      const data = JSON.parse(text)
      const res = await fetch('/api/admin/templates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Import failed')
      setImportResult(json)
      setImportFile(null)
      setPreviewMeta(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Export */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Export this site as a template</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-lg">
              Downloads a JSON file containing all settings, design tokens, feature flag states, navigation, CMS page structure, subscription plans, and knowledge base content. Use this to spin up a new site with the same configuration, or to back up your site settings.
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Settings', 'Design tokens', 'Feature flags', 'Navigation', 'CMS pages', 'Subscription plans', 'KB articles'].map((item) => (
                <span key={item} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-shrink-0 px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Exporting…' : '↓ Export template'}
          </button>
        </div>
      </section>

      {/* Import */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Import a template</h2>
          <p className="text-xs text-gray-500 mt-1">
            Apply settings, design, and content from a template file. This will overwrite your current settings, navigation, CMS pages, subscription plans, and KB content. Your users, orders, and support tickets are not affected.
          </p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          ⚠️ <strong>This overwrites your current configuration.</strong> Export a backup first if you want to preserve your current settings.
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
          className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#C4AB77] transition-colors"
        >
          {importFile ? (
            <div>
              <div className="text-sm font-semibold text-gray-900">{importFile.name}</div>
              {previewMeta && (
                <div className="mt-1">
                  <div className="text-xs text-[#C4AB77] font-medium">{previewMeta.name}</div>
                  {previewMeta.description && <div className="text-xs text-gray-500 italic mt-0.5">{previewMeta.description}</div>}
                  {previewMeta.generatedAt && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Exported {new Date(previewMeta.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Drop a <code className="font-mono text-xs bg-gray-100 px-1 rounded">.json</code> template file here, or{' '}
              <span className="text-[#C4AB77] underline">click to browse</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />

        {importError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{importError}</p>
        )}

        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded px-4 py-3">
            <p className="text-sm font-semibold text-green-800 mb-1">Template imported successfully</p>
            <ul className="text-xs text-green-700 space-y-0.5">
              {importResult.imported.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
            <p className="text-xs text-green-600 mt-2">Reload the page to see your updated settings and design.</p>
          </div>
        )}

        {importFile && previewMeta && !importError && (
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing…' : 'Import and overwrite current settings'}
            </button>
            <button
              onClick={() => { setImportFile(null); setPreviewMeta(null); setImportError('') }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* How to spin up a new site */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-bold text-gray-900">How to spin up a new site</h2>
        <ol className="text-xs text-gray-600 space-y-2 list-none">
          {[
            { n: '1', text: 'Export this site as a template using the button above.' },
            { n: '2', text: 'Clone the platform repository to a new directory (or fork it on GitHub).' },
            { n: '3', text: 'Create a new PostgreSQL database (Neon is free) and set DATABASE_URL in the new repo\'s .env file.' },
            { n: '4', text: 'Run pnpm db:push to create the schema on the new database.' },
            { n: '5', text: 'Deploy the new repo to Vercel and set your environment variables.' },
            { n: '6', text: 'Visit /setup on the new site — upload the template file, choose a new name, and create your admin account.' },
            { n: '7', text: 'Point your domain to Vercel, connect your API keys in Admin → Settings → Connections, and launch.' },
          ].map(({ n, text }) => (
            <li key={n} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-[#C4AB77] text-white rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-gray-400 mt-2">
          The template carries settings, design, and content structure. Each new site has its own database, users, and domain — they are fully independent.
        </p>
      </section>

    </div>
  )
}
