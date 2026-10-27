import { api } from '../http/http'
import { keepAmountResponseSchema } from '../../domain/rebalance/keep-amount'

const path = (accountId: string, productCode: string) =>
  `accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productCode)}/rebalance-keep-amount`

export async function fetchKeepAmount(accountId: string, productCode: string, signal?: AbortSignal) {
  return keepAmountResponseSchema.parse(await api.get(path(accountId, productCode), { signal, retry: 0 }).json())
}

export async function saveKeepAmount(accountId: string, productCode: string, keepAmount: number) {
  return keepAmountResponseSchema.parse(await api.put(path(accountId, productCode), { json: { keepAmount } }).json())
}
