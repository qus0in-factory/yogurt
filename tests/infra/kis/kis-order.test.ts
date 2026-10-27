import { describe, expect, it, vi } from 'vitest'
import { createKisClient } from '../../../src/infra/kis/kis-client.ts'
import { IOC_ORDER_DVSN } from '../../../src/infra/kis/kis-order-check.ts'
import { ORDER_PATH, placeSingleOrder } from '../../../src/infra/kis/kis-order.ts'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

function client(handler: (url: string, init?: RequestInit) => Response, hashkey = 'abc') {
  return {
    accountNumber: '12345678', hashkey: vi.fn(async () => hashkey),
    request: vi.fn(async (path: string, options: { trId: string; body?: unknown; headers?: Record<string, string> }) => handler(path, options as never)),
  }
}

describe('단일 주문 실행', () => {
  it('한 종목 한 건만 보내고 주문번호를 반환한다', async () => {
    const account = client((url) => { expect(url).toBe(ORDER_PATH); return ok({ rt_cd: '0', output: { ODNO: '12345' } }) })
    const result = await placeSingleOrder({ account, productCode: '01', code: '005930', quantity: 2, side: 'buy', orderType: 'ioc', price: 10000 })
    expect(account.request).toHaveBeenCalledTimes(1)
    const [, options] = vi.mocked(account.request).mock.calls[0] as [string, { body: Record<string, unknown> }]
    expect(Object.keys(options.body)).not.toContain('orders')
    expect(options.body).toMatchObject({ PDNO: '005930', ORD_QTY: '2', ORD_DVSN: IOC_ORDER_DVSN, EXCG_ID_DVSN_CD: 'KRX', ORD_UNPR: '0' })
    expect(result).toMatchObject({ orderNo: '12345' })
  })

  it('매도는 매도 TR_ID를 쓰고 hashkey 헤더를 붙인다', async () => {
    const account = client(() => ok({ rt_cd: '0', output: { ODNO: '9' } }))
    await placeSingleOrder({ account, productCode: '22', code: '005930', quantity: 1, side: 'sell', orderType: 'ioc', price: 10000 })
    const [, options] = vi.mocked(account.request).mock.calls[0] as [string, { trId: string; headers: Record<string, string>; body: Record<string, string> }]
    expect(options.trId).toBe('TTTC0801U')
    expect(options.body['ORD_DVSN']).toBe(IOC_ORDER_DVSN)
    expect(options.headers['hashkey']).toBe('abc')
  })

  it('잔고 부족 등 실패 코드를 변환하고 원문을 노출하지 않는다', async () => {
    const account = client(() => ok({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '0312-1234-5678 잔고가 부족합니다' }))
    const error = await placeSingleOrder({ account, productCode: '01', code: '005930', quantity: 99, side: 'buy', orderType: 'ioc', price: 10000 }).catch((e) => e)
    expect(error.failure).toBe('INSUFFICIENT_BALANCE')
    expect(String(error.message)).not.toContain('0312')
  })

  it('401 응답 시 실제 클라이언트도 주문 POST를 재시도하지 않는다', async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (String(url).includes('oauth2/tokenP')) return Response.json({ access_token: 't', expires_in: 100 })
      if (String(url).includes('/uapi/hashkey')) return Response.json({ HASH: 'h' })
      return new Response('unauthorized', { status: 401 })
    })
    const deleted: string[] = []
    const cache = { get: async () => null, put: async () => {}, delete: async (key: string) => { deleted.push(key) } } as unknown as KVNamespace
    const repository = { findCredentials: async () => ({ accountNumber: '12345678', productCode: '01', accessKey: 'k', secretKey: 's' }) }
    const c = createKisClient({ cache, repository: repository as never, key: 'k', fetchFn: fetchFn as typeof fetch })
    const account = (await c.forAccount('a1'))!
    await expect(placeSingleOrder({ account, productCode: '01', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000 })).rejects.toThrow()
    expect(fetchFn.mock.calls.filter(([u]) => String(u).includes('order-cash'))).toHaveLength(1)
    expect(deleted).toContain('kis-token:a1')
  })

  it('주문 성공 뒤에는 토큰 캐시를 무효화하지 않는다', async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (String(url).includes('oauth2/tokenP')) return Response.json({ access_token: 't', expires_in: 100 })
      if (String(url).includes('/uapi/hashkey')) return Response.json({ HASH: 'h' })
      return Response.json({ rt_cd: '0', output: { ODNO: '1' } })
    })
    const deleted: string[] = []
    const cache = { get: async () => null, put: async () => {}, delete: async (key: string) => { deleted.push(key) } } as unknown as KVNamespace
    const repository = { findCredentials: async () => ({ accountNumber: '12345678', productCode: '01', accessKey: 'k', secretKey: 's' }) }
    const c = createKisClient({ cache, repository: repository as never, key: 'k', fetchFn: fetchFn as typeof fetch })
    const account = (await c.forAccount('a1'))!
    await expect(placeSingleOrder({ account, productCode: '01', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc' })).resolves.toMatchObject({ orderNo: '1' })
    expect(deleted).toEqual([])
  })
})
