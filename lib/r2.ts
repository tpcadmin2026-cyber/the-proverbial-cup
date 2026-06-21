// Supabase Storage — replaces Cloudflare R2.
// Credentials come from environment variables set in Railway.

import { createClient } from '@supabase/supabase-js'

function getConfig() {
  return {
    url:        process.env.SUPABASE_URL            ?? '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY    ?? '',
    bucket:     process.env.SUPABASE_BUCKET         ?? 'media',
  }
}

function configured(cfg: { url: string; serviceKey: string }) {
  return !!(cfg.url && cfg.serviceKey)
}

function makeClient(cfg: { url: string; serviceKey: string }) {
  return createClient(cfg.url, cfg.serviceKey, {
    auth: { persistSession: false },
  })
}

// Generate a presigned upload URL — browser uploads directly to Supabase Storage.
export async function getUploadUrl(key: string, _contentType: string): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  const cfg = getConfig()
  if (!configured(cfg)) return null

  const supabase = makeClient(cfg)
  const { data, error } = await supabase.storage.from(cfg.bucket).createSignedUploadUrl(key)
  if (error || !data) return null

  const publicUrl = `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${key}`
  return { uploadUrl: data.signedUrl, publicUrl }
}

// List media files in the bucket.
export async function listMedia(prefix = 'media/', maxKeys = 200) {
  const cfg = getConfig()
  if (!configured(cfg)) return []

  const supabase = makeClient(cfg)
  const { data, error } = await supabase.storage.from(cfg.bucket).list(prefix, { limit: maxKeys })
  if (error || !data) return []

  const publicBase = `${cfg.url}/storage/v1/object/public/${cfg.bucket}`
  return data
    .filter(obj => obj.name)
    .map(obj => ({
      key:       `${prefix}${obj.name}`,
      url:       `${publicBase}/${prefix}${obj.name}`,
      size:      obj.metadata?.size ?? 0,
      updatedAt: obj.updated_at ? new Date(obj.updated_at) : new Date(),
    }))
}

// Delete a file from the bucket.
export async function deleteMedia(key: string): Promise<void> {
  const cfg = getConfig()
  if (!configured(cfg)) return
  const supabase = makeClient(cfg)
  await supabase.storage.from(cfg.bucket).remove([key])
}

// Legacy export — kept so any existing imports don't break.
export async function getR2Config() {
  return getConfig()
}
