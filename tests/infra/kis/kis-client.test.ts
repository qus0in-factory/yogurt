// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { createKisClient } from '../../../src/infra/kis/kis-client.ts'
import { createFakeKv } from '../fakes/kv.ts'

const creds = { accessKey: 'AK', secretKey: 'SK', accountNumber: '123', productCode: '01' }
async function setup(responses: Response[], missing = false) {
  const cache = createFakeKv()
  await cache.put('kis-token:a', JSON.stringify({ accessToken: 'old', expiresAt: 9999 }))
  const fetchFn = vi.fn<typeof fetch>().mockImplementation(async () => responses.shift()!)
  const repository = { findCredentials: vi.fn(async () => missing ? null : creds) }
  const client = createKisClient({ cache, repository, key: 'key', fetchFn, now: () => 1000 })
  return { cache, fetchFn, repository, account: await client.forAccount('a') }
}
const json = (body: unknown) => Response.json(body)
it('returns null for a missing account without fetching', async () => {
  const { account, fetchFn, repository } = await setup([], true)
  expect(account).toBeNull()
  expect(repository.findCredentials).toHaveBeenCalledWith('a', 'key')
  expect(fetchFn).not.toHaveBeenCalled()
})
it('injects cached token, credentials, query and JSON body; preserves response', async () => {
  const { account, fetchFn } = await setup([json({ result: 1 })])
  expect(account).toMatchObject({ accountNumber: '123', productCode: '01' })
  const response = await account!.request('/uapi/test', {
    method: 'POST', trId: 'T1', query: { q: 'a & b' }, body: { value: 2 },
  })
  const [url, options] = fetchFn.mock.calls[0]
  expect(String(url)).toBe('https://openapi.koreainvestment.com:9443/uapi/test?q=a+%26+b')
  expect(options).toMatchObject({ method: 'POST', body: '{"value":2}' })
  expect(new Headers(options?.headers)).toEqual(new Headers({
    'content-type': 'application/json', authorization: 'Bearer old',
    appkey: 'AK', appsecret: 'SK', tr_id: 'T1', custtype: 'P',
  }))
  expect(await response.json()).toEqual({ result: 1 })
  expect(JSON.stringify(account)).not.toMatch(/old|AK|SK/)
})
it.each([401, 'EGW00123'])('invalidates and retries exactly once for %s', async (failure) => {
  const expired = () => typeof failure === 'number'
    ? new Response('unauthorized', { status: failure }) : json({ msg_cd: failure })
  const { account, fetchFn, cache } = await setup([
    expired(), json({ access_token: 'new', expires_in: 3600 }), expired(),
  ])
  const remove = vi.spyOn(cache, 'delete')
  const response = await account!.request('/uapi/test', { method: 'GET', trId: 'T1' })
  expect(fetchFn).toHaveBeenCalledTimes(3)
  expect(remove).toHaveBeenCalledExactlyOnceWith('kis-token:a')
  expect(new Headers(fetchFn.mock.calls[2][1]?.headers).get('authorization')).toBe('Bearer new')
  expect(response.status).toBe(typeof failure === 'number' ? 401 : 200)
})
it('issues on cache miss and reuses the issued token', async () => {
  const { account, fetchFn, cache } = await setup([
    json({ access_token: 'new', expires_in: 3600 }), json({ ok: true }), json({ ok: true }),
  ])
  await cache.delete('kis-token:a')
  await account!.request('/uapi/test', { method: 'GET', trId: 'T' })
  await account!.request('/uapi/test', { method: 'GET', trId: 'T' })
  expect(fetchFn).toHaveBeenCalledTimes(3)
  expect(String(fetchFn.mock.calls[0][0])).toContain('/oauth2/tokenP')
})
it('preserves non-JSON errors without retrying', async () => {
  const { account, fetchFn } = await setup([new Response('bad', { status: 500 })])
  expect(await (await account!.request('/uapi/test', { method: 'GET', trId: 'T' })).text()).toBe('bad')
  expect(fetchFn).toHaveBeenCalledTimes(1)
})
it('returns a readable successful response after refreshing an expired token', async () => {
  const { account, fetchFn } = await setup([
    json({ msg_cd: 'EGW00123' }), json({ access_token: 'new', expires_in: 3600 }), json({ result: 7 }),
  ])
  const response = await account!.request('/uapi/test', { method: 'GET', trId: 'T' })
  expect(await response.json()).toEqual({ result: 7 })
  expect(fetchFn).toHaveBeenCalledTimes(3)
})
it('stops when token issuance fails', async () => {
  const { account, fetchFn, cache } = await setup([new Response('bad', { status: 500 })])
  await cache.delete('kis-token:a')
  await expect(account!.request('/uapi/test', { method: 'GET', trId: 'T' })).rejects.toThrow('KIS token request failed')
  expect(fetchFn).toHaveBeenCalledTimes(1)
})
