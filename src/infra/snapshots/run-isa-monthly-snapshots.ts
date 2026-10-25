import { isValidEncryptionKey } from '../accounts/account-crypto.ts'
import { createAccountRepository } from '../accounts/account-repository.ts'
import { createKisClient } from '../kis/kis-client.ts'
import { recordIsaMonthlySnapshots } from './isa-monthly-snapshot-recorder.ts'

export async function runIsaMonthlySnapshots(
  env: Env,
  fetchFn: typeof fetch = fetch,
  now = new Date(),
): Promise<void> {
  const { DB, CACHE, ACCOUNT_ENCRYPTION_KEY: key } = env
  if (!DB || !CACHE || !key || !isValidEncryptionKey(key)) return
  const repository = createAccountRepository(DB)
  const accounts = (await repository.list())
    .filter((account) => account.products.includes('01'))
    .map((account) => ({ accountId: account.id, startDate: account.productPlans['01']?.startDate ?? null }))
  const kis = createKisClient({ cache: CACHE, repository, key, fetchFn })
  await recordIsaMonthlySnapshots(accounts, CACHE, kis, now)
}
