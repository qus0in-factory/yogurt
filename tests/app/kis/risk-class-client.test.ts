import { describe, expect, it, vi } from 'vitest'
import { getRiskClasses, setRiskClass } from '../../../src/app/kis/risk-class-client'
import { api } from '../../../src/app/http/http'
vi.mock('../../../src/app/http/http', () => ({ api: { get: vi.fn(), put: vi.fn() } }))

describe('risk class client', () => {
  it('계좌·상품 코드를 인코딩해 위험 구분을 조회한다', async () => {
    vi.mocked(api.get).mockReturnValue({ json: async () => ({ classes: { '005930': 'safe' } }) } as never)
    expect(await getRiskClasses('a/b', '29')).toEqual({ '005930': 'safe' })
    expect(api.get).toHaveBeenCalledWith('accounts/a%2Fb/products/29/risk-classes')
  })

  it('종목 코드를 인코딩해 위험 구분을 저장한다', async () => {
    vi.mocked(api.put).mockReturnValue({ json: async () => ({ stockCode: '005930', riskClass: 'risk' }) } as never)
    expect(await setRiskClass('a', '29', '005930', 'risk')).toEqual({ stockCode: '005930', riskClass: 'risk' })
    expect(api.put).toHaveBeenCalledWith('accounts/a/products/29/risk-classes/005930', { json: { riskClass: 'risk' } })
  })

  it('응답 형식이 다르면 거부한다', async () => {
    vi.mocked(api.get).mockReturnValue({ json: async () => ({ classes: { '005930': 'unknown' } }) } as never)
    await expect(getRiskClasses('a', '29')).rejects.toThrow()
  })
})
