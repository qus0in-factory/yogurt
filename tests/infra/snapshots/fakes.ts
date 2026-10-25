export const summary = (total: number) => ({
  tot_asst_amt: String(total),
  nass_tot_amt: '0', evlu_amt_smtl: '0', pchs_amt_smtl: '0',
  evlu_pfls_amt_smtl: '0', loan_amt_smtl: '0', dncl_amt: '0', tot_dncl_amt: '0',
  cma_evlu_amt: '0', frcr_evlu_tota: '0',
})
export const rawRow = (evaluationAmount: number) => ({
  pchs_amt: '0', evlu_amt: String(evaluationAmount), evlu_pfls_amt: '0',
  crdt_lnd_amt: '0', real_nass_amt: String(evaluationAmount), whol_weit_rt: '0',
})

export type FakeAssets = { rows?: number[]; total?: number }
export function fakeKis(assets: Record<string, FakeAssets | Error>, calls: string[] = []) {
  return {
    calls,
    async forAccount(id: string) {
      calls.push(id)
      const value = assets[id]
      if (value instanceof Error) throw value
      return {
        accountNumber: '12345678',
        request: async () => Response.json({
          rt_cd: '0',
          output1: (value.rows ?? []).map(rawRow),
          output2: value.total === undefined ? undefined : summary(value.total),
        }),
      }
    },
  }
}

export function fakeKv() {
  const store = new Map<string, string>()
  const puts: Array<{ key: string; expirationTtl?: number }> = []
  const kv = {
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      store.set(key, value)
      puts.push({ key, expirationTtl: options?.expirationTtl })
    },
  } as unknown as KVNamespace
  return { kv, store, puts }
}
