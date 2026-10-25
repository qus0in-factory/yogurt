import { z } from 'zod'

const numberValue = z.string()
  .transform((value) => Number(value.replace(/,/g, '')))
  .refine((number) => Number.isFinite(number), { error: '숫자 형식이 아닙니다' })

const holdingSchema = z.object({
  pdno: z.string(), prdt_name: z.string(), hldg_qty: numberValue, pchs_avg_pric: numberValue,
  pchs_amt: numberValue, prpr: numberValue, evlu_amt: numberValue, evlu_pfls_amt: numberValue,
  evlu_pfls_rt: numberValue,
})

const cashValue = z.union([z.string(), z.number(), z.null()]).optional()
  .transform((value) => {
    if (value === null || value === undefined) return 0
    const number = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
    return Number.isFinite(number) ? number : 0
  })

const summarySchema = z.object({
  dnca_tot_amt: cashValue, scts_evlu_amt: numberValue, tot_evlu_amt: numberValue, nass_amt: numberValue,
  pchs_amt_smtl_amt: numberValue, evlu_amt_smtl_amt: numberValue, evlu_pfls_smtl_amt: numberValue,
  asst_icdc_amt: numberValue, asst_icdc_erng_rt: numberValue,
})

const rawSchema = z.object({
  output1: z.array(holdingSchema),
  output2: z.array(summarySchema).min(1),
})

const toHolding = (holding: z.infer<typeof holdingSchema>) => ({
  code: holding.pdno, name: holding.prdt_name, quantity: holding.hldg_qty, averagePrice: holding.pchs_avg_pric,
  purchaseAmount: holding.pchs_amt, currentPrice: holding.prpr, evaluationAmount: holding.evlu_amt,
  profitLoss: holding.evlu_pfls_amt, profitLossRate: holding.evlu_pfls_rt,
})

const toSummary = (summary: z.infer<typeof summarySchema>) => ({
  cash: summary.dnca_tot_amt, stockEvaluation: summary.scts_evlu_amt, totalEvaluation: summary.tot_evlu_amt,
  netAssets: summary.nass_amt, purchaseAmount: summary.pchs_amt_smtl_amt, evaluationAmount: summary.evlu_amt_smtl_amt,
  profitLoss: summary.evlu_pfls_smtl_amt, assetChange: summary.asst_icdc_amt, assetChangeRate: summary.asst_icdc_erng_rt,
})

export function parseStockBalance(raw: unknown) {
  const parsed = rawSchema.parse(raw)
  return { summary: toSummary(parsed.output2[0]), holdings: parsed.output1.map(toHolding) }
}
