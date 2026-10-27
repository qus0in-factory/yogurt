import { expect, it } from 'vitest'
import { parseStockBalance } from '../../../src/domain/kis/stock-balance'
const row = { pdno: 'A', prdt_name: 'A', hldg_qty: '10', pchs_avg_pric: '1', pchs_amt: '10', prpr: '1', evlu_amt: '10', evlu_pfls_amt: '0', evlu_pfls_rt: '0' }
const summary = Object.fromEntries(['dnca_tot_amt','scts_evlu_amt','tot_evlu_amt','nass_amt','pchs_amt_smtl_amt','evlu_amt_smtl_amt','evlu_pfls_smtl_amt','asst_icdc_amt','asst_icdc_erng_rt'].map(k => [k, '0']))
it.each([undefined, '3', '0', 'bad'])('ord_psbl_qty %s를 보존하거나 미확인으로 남긴다', value => {
  const parsed = parseStockBalance({ output1: [{ ...row, ord_psbl_qty: value }], output2: [summary] })
  expect(parsed.holdings[0].sellableQuantity).toBe(value === '3' ? 3 : value === '0' ? 0 : undefined)
})
