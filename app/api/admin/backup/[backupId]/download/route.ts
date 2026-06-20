import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// GET /api/admin/backup/[backupId]/download — generate a presigned download URL
export async function GET(_req: NextRequest, { params }: { params: { backupId: string } }) {
  try {
    await requireAdmin()

    const backup = await db.backupRecord.findUnique({ where: { id: params.backupId } })
    if (!backup || backup.status !== 'completed' || !backup.storageKey) {
      return NextResponse.json({ error: 'Backup not found or not complete' }, { status: 404 })
    }

    const b2KeyId    = process.env.B2_KEY_ID           || await getSetting<string>('b2.keyId',    '')
    const b2AppKey   = process.env.B2_APPLICATION_KEY  || await getSetting<string>('b2.appKey',   '')
    const b2Bucket   = process.env.B2_BUCKET_NAME      || await getSetting<string>('b2.bucket',   '')
    const b2Endpoint = process.env.B2_ENDPOINT         || await getSetting<string>('b2.endpoint', '')

    if (!b2KeyId || !b2AppKey || !b2Bucket || !b2Endpoint) {
      return NextResponse.json({ error: 'B2 not configured' }, { status: 503 })
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: b2Endpoint,
      credentials: { accessKeyId: b2KeyId, secretAccessKey: b2AppKey },
    })

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: b2Bucket, Key: backup.storageKey }),
      { expiresIn: 300 }
    )

    return NextResponse.json({ url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
