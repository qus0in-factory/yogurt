import { describe, expect, it } from 'vitest'
import { parseStockBalance } from '../../../src/domain/kis/stock-balance'

const holding = {
  pdno: '005930', prdt_name: '삼성전자', hldg_qty: '10', pchs_avg_pric: '70,000',
  pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28',
}
const summaryRow = {
  dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000',
  pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000',
  asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84',
}
const raw = { rt_cd: '0', msg_cd: 'OP0007109e-2', msg1: '조회 되었습니다', output1: [holding], output2: [summaryRow] }

const expected = {
  summary: { cash: 1900000, stockEvaluation: 800000, totalEvaluation: 2700000, netAssets: 2700000, purchaseAmount: 700000, evaluationAmount: 800000, profitLoss: 100000, assetChange: 100000, assetChangeRate: 3.84 },
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, averagePrice: 70000, purchaseAmount: 700000, currentPrice: 80000, evaluationAmount: 800000, profitLoss: 100000, profitLossRate: 14.28 }],
}

describe('parseStockBalance', () => {
  it('output1·output2를 정규화하고 쉼표는 제거한다', () => {
    expect(parseStockBalance(raw)).toEqual(expected)
  })

  it('보유 종목이 없으면 holdings는 빈 배열이다', () => {
    expect(parseStockBalance({ ...raw, output1: [] })).toEqual({ summary: expected.summary, holdings: [] })
  })

  it('모르는 필드는 제거하고 요약·보유만 나타낸다', () => {
    const parsed = parseStockBalance({ ...raw, ctx_area_fk100: 'x' })
    expect(Object.keys(parsed)).toEqual(['summary', 'holdings'])
  })

  it('output1 누락은 throw한다', () => {
    const partial = { rt_cd: '0', msg_cd: 'x', msg1: 'y', output2: [summaryRow] }
    expect(() => parseStockBalance(partial)).toThrow()
  })

  it('output2가 비면 throw한다', () => {
    expect(() => parseStockBalance({ ...raw, output2: [] })).toThrow()
  })

  it('출력 필드가 문자열이 아니면 throw한다', () => {
    expect(() => parseStockBalance({ ...raw, output1: [{ ...holding, pdno: 123 }] })).toThrow()
  })
})
