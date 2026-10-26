import { expect, it, vi } from 'vitest'
import { cachedQuote } from '../../../src/infra/quotes/cache'
const quote = { code: '005930', price: 70000, asOf: new Date().toISOString() }
const cache = (value: unknown = null) => ({ get: vi.fn(async () => value), put: vi.fn() })
it('캐시 적중은 KIS를 호출하지 않는다', async () => {
  const kv = cache(JSON.stringify(quote)), load = vi.fn()
  expect(await cachedQuote(kv as never, quote.code, load)).toEqual(quote)
  expect(load).not.toHaveBeenCalled()
})
it('미적중 성공만 quote:CODE에 TTL60으로 저장한다', async () => {
  const kv = cache(), load = vi.fn(async () => quote)
  expect(await cachedQuote(kv as never, quote.code, load)).toEqual(quote)
  expect(kv.put).toHaveBeenCalledExactlyOnceWith('quote:005930', JSON.stringify(quote), { expirationTtl: 60 })
})
it.each([404, 503])('%i 실패는 캐시하지 않는다', async status => {
  const kv = cache()
  await expect(cachedQuote(kv as never, quote.code, async () => { throw { status } })).rejects.toEqual({ status })
  expect(kv.put).not.toHaveBeenCalled()
})
it('KV 읽기·쓰기 실패는 성공 응답을 막지 않는다', async () => {
  const kv = cache()
  kv.get.mockRejectedValue(new Error('offline'))
  kv.put.mockRejectedValue(new Error('offline'))
  expect(await cachedQuote(kv as never, quote.code, async () => quote)).toEqual(quote)
})
it('60초가 지난 캐시 값은 재조회한다', async () => {
  const kv = cache(JSON.stringify({ ...quote, asOf: new Date(Date.now() - 60001).toISOString() }))
  const load = vi.fn(async () => quote)
  expect(await cachedQuote(kv as never, quote.code, load)).toEqual(quote)
  expect(load).toHaveBeenCalledTimes(1)
})
