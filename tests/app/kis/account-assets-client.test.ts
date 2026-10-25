import { describe, expect, it, vi } from 'vitest'
import { getAccountAssets, getProductBalance } from '../../../src/app/kis/account-assets-client'
import { api } from '../../../src/app/http/http'
vi.mock('../../../src/app/http/http', () => ({ api: { get: vi.fn() } }))

const assets = {
  rows: [{ index: 0, purchaseAmount: 1000, evaluationAmount: 1200, profitLoss: 200, creditLoan: 30, netAssets: 1170, weight: 12.34 }],
  summary: { totalAssets: 60000, netAssets: 50000, evaluationAmount: 40000, purchaseAmount: 30000, profitLoss: 10000,
    loanAmount: 2000, deposit: 100, totalDeposit: 200, cmaEvaluation: 300, foreignEvaluation: 400 },
}
const balance = {
  summary: { cash: 0, stockEvaluation: 0, totalEvaluation: 0, netAssets: 0, purchaseAmount: 0,
    evaluationAmount: 0, profitLoss: 0, assetChange: 0, assetChangeRate: 0 },
  holdings: [],
}

describe('account assets client', () => {
  it('계좌·상품 코드를 인코딩해 자산현황을 조회한다', async () => {
    vi.mocked(api.get).mockReturnValue({ json: async () => assets } as never)
    expect(await getAccountAssets('a/b', '22')).toEqual(assets)
    expect(api.get).toHaveBeenCalledWith('accounts/a%2Fb/products/22/assets')
  })

  it('잔고 조회에도 상품 코드를 적용한다', async () => {
    vi.mocked(api.get).mockReturnValue({ json: async () => balance } as never)
    expect(await getProductBalance('a', '22')).toEqual(balance)
    expect(api.get).toHaveBeenCalledWith('accounts/a/products/22/balance', { signal: undefined, retry: 0 })
  })

  it('응답 형식이 다르면 거부한다', async () => {
    vi.mocked(api.get).mockReturnValue({ json: async () => ({ rows: [], summary: {} }) } as never)
    await expect(getAccountAssets('a', '22')).rejects.toThrow()
  })
})
