'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ActivateGiftButton({ accountId, giftId }: { accountId: string; giftId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function activate() {
    setLoading(true)
    await fetch(`/api/corporate/${accountId}/gifts/${giftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={activate}
      disabled={loading}
      className="text-xs text-green-600 hover:underline disabled:opacity-50"
    >
      {loading ? '…' : 'Activate'}
    </button>
  )
}
