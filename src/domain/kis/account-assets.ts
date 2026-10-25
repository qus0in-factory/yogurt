import { z } from 'zod'

const numberValue = z.string().trim().min(1)
  .transform(value => value.replace(/,/g, ''))
  .pipe(z.string().regex(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/))
  .transform(Number).refine(Number.isFinite, { error: '숫자 형식이 아닙니다' })
const rowSchema = z.object({
  pchs_amt: numberValue, evlu_amt: numberValue, evlu_pfls_amt: numberValue,
  crdt_lnd_amt: numberValue, real_nass_amt: numberValue, whol_weit_rt: numberValue,
})
const summarySchema = z.object({
  tot_asst_amt: numberValue, nass_tot_amt: numberValue, evlu_amt_smtl: numberValue,
  pchs_amt_smtl: numberValue, evlu_pfls_amt_smtl: numberValue, loan_amt_smtl: numberValue,
  dncl_amt: numberValue, tot_dncl_amt: numberValue, cma_evlu_amt: numberValue,
  frcr_evlu_tota: numberValue,
})
const rawSchema = z.object({ output1: rowSchema.array(), output2: summarySchema })

export function parseAccountAssets(raw: unknown) {
  const { output1, output2: summary } = rawSchema.parse(raw)
  return {
    rows: output1.map((row, index) => ({
      index, purchaseAmount: row.pchs_amt, evaluationAmount: row.evlu_amt,
      profitLoss: row.evlu_pfls_amt, creditLoan: row.crdt_lnd_amt,
      netAssets: row.real_nass_amt, weight: row.whol_weit_rt,
    })),
    summary: {
      totalAssets: summary.tot_asst_amt, netAssets: summary.nass_tot_amt,
      evaluationAmount: summary.evlu_amt_smtl, purchaseAmount: summary.pchs_amt_smtl,
      profitLoss: summary.evlu_pfls_amt_smtl, loanAmount: summary.loan_amt_smtl,
      deposit: summary.dncl_amt, totalDeposit: summary.tot_dncl_amt,
      cmaEvaluation: summary.cma_evlu_amt, foreignEvaluation: summary.frcr_evlu_tota,
    },
  }
}
