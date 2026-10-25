// @vitest-environment node
import type { Context } from 'hono'
import { expect, it, vi } from 'vitest'
import { kisClientFromEnv } from '../../../src/infra/kis/kis-context.ts'
import { createFakeKv } from '../fakes/kv.ts'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)))
const context = (env: unknown) => ({ env }) as Context<{ Bindings: Env }>
it.each(['DB', 'ACCOUNT_ENCRYPTION_KEY', 'CACHE'])('requires %s', (field) => {
  const env: Record<string, unknown> = { DB: {}, ACCOUNT_ENCRYPTION_KEY: key, CACHE: createFakeKv() }
  delete env[field]
  expect(kisClientFromEnv(context(env))).toBeNull()
})
it('rejects invalid encryption keys', () => {
  expect(kisClientFromEnv(context({ DB: {}, CACHE: createFakeKv(), ACCOUNT_ENCRYPTION_KEY: 'bad' }))).toBeNull()
})
it('wires encrypted credentials, cache and injected fetch without exposing secrets', async () => {
  const row = { access_key_enc: await encryptText('AK', key), secret_key_enc: await encryptText('SK', key),
    account_number: '123', product_code: '01' }
  const DB = { prepare: () => ({ bind: () => ({ first: async () => row }) }) }
  const cache = createFakeKv()
  const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ access_token: 'secret', expires_in: 3600 }))
  const client = kisClientFromEnv(context({ DB, ACCOUNT_ENCRYPTION_KEY: key, CACHE: cache }), fetchFn)
  const account = await client!.forAccount('a')
  expect(account).toMatchObject({ accountNumber: '123', productCode: '01' })
  const result = await account!.ensureToken()
  expect(result.issued).toBe(true)
  expect(result.expiresAt).toBeGreaterThan(Date.now())
  expect(JSON.stringify(result)).not.toContain('secret')
  expect((await account!.ensureToken()).issued).toBe(false)
  expect(fetchFn).toHaveBeenCalledTimes(1)
})
