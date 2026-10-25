import { expect, it } from 'vitest'
import { parseAccountAssets } from '../../../src/domain/kis/account-assets'

const row = { pchs_amt: '1,000', evlu_amt: '1,200', evlu_pfls_amt: '200',
  crdt_lnd_amt: '30', real_nass_amt: '1,170', whol_weit_rt: '12.34' }
const summary = { tot_asst_amt: '60,000', nass_tot_amt: '50,000', evlu_amt_smtl: '40,000',
  pchs_amt_smtl: '30,000', evlu_pfls_amt_smtl: '10,000', loan_amt_smtl: '2,000',
  dncl_amt: '100', tot_dncl_amt: '200', cma_evlu_amt: '300', frcr_evlu_tota: '400' }
const raw = { output1: [row], output2: summary }
it('자산군 이름을 추측하지 않고 순서와 숫자를 정규화한다', () => {
  const parsed = parseAccountAssets({ ...raw, output1: [row, { ...row, evlu_pfls_amt: '-1.5' }] })
  expect(parsed.rows).toEqual([
    { index: 0, purchaseAmount: 1000, evaluationAmount: 1200, profitLoss: 200,
      creditLoan: 30, netAssets: 1170, weight: 12.34 },
    { index: 1, purchaseAmount: 1000, evaluationAmount: 1200, profitLoss: -1.5,
      creditLoan: 30, netAssets: 1170, weight: 12.34 },
  ])
  expect(parsed.summary).toEqual({ totalAssets: 60000, netAssets: 50000, evaluationAmount: 40000,
    purchaseAmount: 30000, profitLoss: 10000, loanAmount: 2000, deposit: 100,
    totalDeposit: 200, cmaEvaluation: 300, foreignEvaluation: 400 })
})
it('빈 자산군 배열과 0을 허용하고 모르는 필드는 노출하지 않는다', () => {
  const parsed = parseAccountAssets({ ...raw, output1: [], output2: { ...summary, dncl_amt: '0', token: 'SECRET' } })
  expect(parsed.rows).toEqual([])
  expect(parsed.summary.deposit).toBe(0)
  expect(JSON.stringify(parsed)).not.toContain('SECRET')
})
it.each(['', 'bad', 'Infinity', 'NaN', '1e999', null, 12])('잘못된 숫자 %s를 거부한다', value => {
  expect(() => parseAccountAssets({ ...raw, output1: [{ ...row, pchs_amt: value }] })).toThrow()
})
it.each([undefined, [], null, {}])('output2가 합계 객체와 다르면 거부한다: %j', output2 => {
  expect(() => parseAccountAssets({ ...raw, output2 })).toThrow()
})
it('필수 자산군 필드와 합계 필드가 없으면 거부한다', () => {
  expect(() => parseAccountAssets({ ...raw, output1: [{}] })).toThrow()
  expect(() => parseAccountAssets({ output2: summary })).toThrow()
})
