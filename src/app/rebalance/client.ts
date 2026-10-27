import { api } from '../http/http'
import { rebalanceInputsSchema } from './schema'
export async function fetchRebalanceInputs(accountId: string, productCode: string, signal?: AbortSignal) {
  const path = `accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productCode)}/rebalance-inputs`
  return rebalanceInputsSchema.parse(await api.get(path, { signal, retry: 0 }).json())
}
