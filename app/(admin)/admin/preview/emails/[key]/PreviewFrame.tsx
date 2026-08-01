'use client'

import { useState } from 'react'

export function PreviewFrame({ src }: { src: string }) {
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Preview</h2>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="text-xs text-[#C4AB77] hover:underline"
        >
          ↻ Refresh (after saving)
        </button>
      </div>
      <iframe key={reloadKey} src={src} className="w-full" style={{ height: '70vh', border: 'none' }} title="Email preview" />
    </div>
  )
}
