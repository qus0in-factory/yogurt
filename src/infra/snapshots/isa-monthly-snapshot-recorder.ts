import { seoulDate, shouldRecordSnapshotMonth } from '../../domain/accounts/snapshot-month.ts'
import { fetchAccountAssets } from '../kis/kis-account-assets.ts'
import { KisApiError, type KisAccountClient } from '../kis/kis-stock-balance.ts'
import { saveIsaSnapshot } from './isa-snapshot-store.ts'

export type IsaAccount = {
  accountId: string
  startDate: string | null
}
type IsaKisClient = {
  forAccount(accountId: string): Promise<KisAccountClient | null>
}
type LogFailure = (message: string, status: number) => void

export async function recordIsaMonthlySnapshots(
  accounts: IsaAccount[],
  cache: KVNamespace,
  kis: IsaKisClient,
  now: Date,
  log: LogFailure = console.error,
): Promise<void> {
  const date = seoulDate(now)
  const yearMonth = date.slice(0, 7)
  for (const { accountId, startDate } of accounts) {
    if (!shouldRecordSnapshotMonth(yearMonth, startDate)) continue
    try {
      const account = await kis.forAccount(accountId)
      if (!account) throw new Error('account not configured')
      const total = (await fetchAccountAssets(account, '01')).summary.totalAssets
      if (!Number.isSafeInteger(total) || total < 0) throw new Error('invalid total assets')
      await saveIsaSnapshot(cache, {
        accountId, date, totalAssetsWon: total, recordedAt: now.toISOString(),
      })
    } catch (error) {
      log('계좌 기록 실패', error instanceof KisApiError ? 502 : 500)
    }
  }
}
