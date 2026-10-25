import type { Context } from 'hono'
import { daysBefore, previousMonthEnd } from '../../domain/accounts/snapshot-month.ts'
import { createAccountRepository } from './account-repository.ts'
import { isaSnapshotKey } from '../snapshots/isa-snapshot-store.ts'

export type IsaLastClose = { date: string; totalAssetsWon: number }

function totalAssets(raw: string | null): number | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as { totalAssetsWon?: unknown }
    const total = value?.totalAssetsWon
    return typeof total === 'number' && Number.isSafeInteger(total) && total >= 0 ? total : null
  } catch {
    return null
  }
}

export async function findIsaLastClose(
  cache: KVNamespace,
  accountId: string,
  now: Date,
): Promise<IsaLastClose | null> {
  let date = previousMonthEnd(now)
  for (let offset = 0; offset <= 7; offset++) {
    const totalAssetsWon = totalAssets(await cache.get(isaSnapshotKey(accountId, date)))
    if (totalAssetsWon !== null) return { date, totalAssetsWon }
    date = daysBefore(date, 1)
  }
  return null
}

export async function isaLastCloseHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  const accountId = c.req.param('accountId') as string
  const account = c.env.DB
    ? (await createAccountRepository(c.env.DB).list()).find((item) => item.id === accountId)
    : undefined
  const cache = c.env.CACHE
  if (!account?.products.includes('01') || !cache) return c.json({ error: 'not found' }, 404)
  const result = await findIsaLastClose(cache, accountId, new Date())
  return result ? c.json(result, 200) : c.json({ error: 'not found' }, 404)
}
