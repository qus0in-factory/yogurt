import { expect, it, vi } from 'vitest'
import { loadInputPrices } from '../../../src/infra/quotes/input-prices'
import { inquirePrice } from '../../../src/infra/quotes/price'
const targets = (codes: string[]) => codes.map(code => ({ kind: 'security', code }))
const loader = (fetchFn: typeof fetch) => (code: string) => inquirePrice({
  request: (_path, options) => fetchFn(options.query!.FID_INPUT_ISCD),
}, code)
it('신규 목표는 조회하고 보유 양수 가격은 우선 사용한다', async () => {
  const fetchFn = vi.fn(async () => Response.json({ rt_cd: '0', output: { stck_prpr: '200' } }))
  const result = await loadInputPrices([{ code: 'A', currentPrice: 100 }], targets(['A', 'B']), undefined, loader(fetchFn))
  expect(result).toEqual({ prices: { A: 100, B: 200 }, priceFailed: [] })
  expect(fetchFn).toHaveBeenCalledExactlyOnceWith('B')
})
it('보유 가격이 없거나0이면 조회하며 중복·현금을 제외한다', async () => {
  const fetchFn = vi.fn(async () => Response.json({ rt_cd: '0', output: { stck_prpr: '200' } }))
  const result = await loadInputPrices([{ code: 'A', currentPrice: 0 }, { code: 'B' }],
    [...targets(['A', 'A']), { kind: 'cash', code: null }], undefined, loader(fetchFn))
  expect(result.prices).toEqual({ A: 200, B: 200 })
  expect(fetchFn).toHaveBeenCalledTimes(2)
})
it('한 종목 실패는 그 코드만 실패 목록에 넣고 다른 결과는 유지한다', async () => {
  const fetchFn = vi.fn(async code => code === 'B' ? new Response(null, { status: 503 })
    : Response.json({ rt_cd: '0', output: { stck_prpr: '200' } }))
  expect(await loadInputPrices([], targets(['A', 'B']), undefined, loader(fetchFn))).toEqual({ prices: { A: 200 }, priceFailed: ['B'] })
})
it('1분 캐시 적중은 시세fetch를 호출하지 않는다', async () => {
  const fetchFn = vi.fn()
  const cache = { get: async () => JSON.stringify({ code: 'A', price: 100, asOf: new Date().toISOString() }) } as never
  expect(await loadInputPrices([], targets(['A']), cache, loader(fetchFn))).toEqual({ prices: { A: 100 }, priceFailed: [] })
  expect(fetchFn).not.toHaveBeenCalled()
})
it('목표7개는 동시 조회하고 중복 목표를 추가해도7회 이하이다', async () => {
  let release!: () => void
  const wait = new Promise<void>(resolve => { release = resolve })
  const fetchFn = vi.fn(async () => { await wait; return Response.json({ rt_cd: '0', output: { stck_prpr: '200' } }) })
  const promise = loadInputPrices([], targets(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A']), undefined, loader(fetchFn))
  await vi.waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(7))
  release()
  expect(Object.keys((await promise).prices)).toHaveLength(7)
  expect(fetchFn).toHaveBeenCalledTimes(7)
})
