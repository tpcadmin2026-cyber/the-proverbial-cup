'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

interface Props {
  apiKey: string
  host: string
  children: React.ReactNode
}

export function PostHogProvider({ apiKey, host, children }: Props) {
  useEffect(() => {
    if (!apiKey) return
    posthog.init(apiKey, {
      api_host: host || 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
    })
  }, [apiKey, host])

  if (!apiKey) return <>{children}</>

  return <PHProvider client={posthog}>{children}</PHProvider>
}
