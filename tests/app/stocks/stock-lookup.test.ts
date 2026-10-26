import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { lookupStockName } from '../../../src/app/stocks/stock-lookup'

const server = setupServer(
  http.get('*/api/stocks/005930', () => HttpResponse.json({ code: '005930', name: '삼성전자' })),
  http.get('*/api/stocks/999999', () => HttpResponse.json({ error: 'stock not found' }, { status: 404 })),
  http.get('*/api/stocks/503503', () => HttpResponse.json({ error: 'unavailable' }, { status: 503 })),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('lookupStockName client', () => {
  it('200 응답 시 종목명을 성공 반환한다', async () => {
    const res = await lookupStockName('005930')
    expect(res).toEqual({ status: 'success', code: '005930', name: '삼성전자' })
  })

  it('404 응답 시 not_found 상태를 반환한다', async () => {
    const res = await lookupStockName('999999')
    expect(res).toEqual({ status: 'not_found' })
  })

  it('503 응답 시 unavailable 상태를 반환한다', async () => {
    const res = await lookupStockName('503503')
    expect(res).toEqual({ status: 'unavailable' })
  })

  it('소문자 코드는 대문자로 변환하여 요청한다', async () => {
    server.use(http.get('*/api/stocks/005930A', () => HttpResponse.json({ code: '005930A', name: '삼성전자우' })))
    const res = await lookupStockName('005930a')
    expect(res).toEqual({ status: 'success', code: '005930A', name: '삼성전자우' })
  })

  it('패턴 위반 코드는 not_found를 반환한다', async () => {
    const res = await lookupStockName('한글코드')
    expect(res).toEqual({ status: 'not_found' })
  })
})
