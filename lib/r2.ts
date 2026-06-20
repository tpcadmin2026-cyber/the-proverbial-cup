// Cloudflare R2 media storage — S3-compatible.
// Credentials read from env vars first, then DB settings.

import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSetting } from './settings'

async function getR2Config() {
  const accountId    = process.env.R2_ACCOUNT_ID     || await getSetting<string>('r2.accountId',     '')
  const accessKeyId  = process.env.R2_ACCESS_KEY_ID  || await getSetting<string>('r2.accessKeyId',   '')
  const secretKey    = process.env.R2_SECRET_KEY      || await getSetting<string>('r2.secretKey',     '')
  const bucket       = process.env.R2_BUCKET          || await getSetting<string>('r2.bucket',        '')
  const publicUrl    = process.env.R2_PUBLIC_URL       || await getSetting<string>('r2.publicUrl',    '')
  return { accountId, accessKeyId, secretKey, bucket, publicUrl }
}

export function r2Configured(cfg: { accountId: string; accessKeyId: string; secretKey: string; bucket: string }): boolean {
  return !!(cfg.accountId && cfg.accessKeyId && cfg.secretKey && cfg.bucket)
}

function makeClient(cfg: { accountId: string; accessKeyId: string; secretKey: string }) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretKey },
  })
}

// Generate a presigned upload URL (browser uploads directly to R2 — no server memory used).
export async function getUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  const cfg = await getR2Config()
  if (!r2Configured(cfg)) return null

  const client = makeClient(cfg)
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }) // 5 min
  const publicUrl = cfg.publicUrl
    ? `${cfg.publicUrl.replace(/\/$/, '')}/${key}`
    : `https://pub-${cfg.accountId}.r2.dev/${key}` // fallback to R2 dev URL

  return { uploadUrl, publicUrl }
}

// List media files in the bucket.
export async function listMedia(prefix = 'media/', maxKeys = 200) {
  const cfg = await getR2Config()
  if (!r2Configured(cfg)) return []

  const client = makeClient(cfg)
  const response = await client.send(new ListObjectsV2Command({
    Bucket: cfg.bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  }))

  const publicBase = cfg.publicUrl?.replace(/\/$/, '') || `https://pub-${cfg.accountId}.r2.dev`

  return (response.Contents ?? []).map(obj => ({
    key:       obj.Key ?? '',
    url:       `${publicBase}/${obj.Key}`,
    size:      obj.Size ?? 0,
    updatedAt: obj.LastModified ?? new Date(),
  }))
}

// Delete a file from the bucket.
export async function deleteMedia(key: string): Promise<void> {
  const cfg = await getR2Config()
  if (!r2Configured(cfg)) return
  const client = makeClient(cfg)
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }))
}

export { getR2Config }
