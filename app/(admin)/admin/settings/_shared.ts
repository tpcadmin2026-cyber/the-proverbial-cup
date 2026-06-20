import { db } from '@/lib/db'

export async function getGroupSettings(group: string) {
  return db.setting.findMany({
    where: { group },
    orderBy: { key: 'asc' },
  })
}
