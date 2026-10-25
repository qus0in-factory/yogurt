import { z } from 'zod'
import { accountSchema, type Account, type AccountInput, type AccountUpdate } from '../../domain/accounts/account.ts'
import type { ProductPlanRequest } from '../../domain/accounts/product-plan.ts'
import { api } from '../http/http.ts'

export async function listAccounts(): Promise<Account[]> {
  return accountSchema.array().parse(await api.get('accounts').json())
}

export async function reorderAccounts(ids: string[]): Promise<Account[]> {
  return accountSchema.array().parse(await api.put('accounts/order', { json: { ids } }).json())
}

export async function createAccount(input: AccountInput): Promise<Account> {
  return accountSchema.parse(await api.post('accounts', { json: input }).json())
}

export async function updateAccount(id: string, input: AccountUpdate): Promise<Account> {
  return accountSchema.parse(await api.patch(`accounts/${encodeURIComponent(id)}`, { json: input }).json())
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`accounts/${encodeURIComponent(id)}`)
}

const kisTokenSchema = z.object({ issued: z.boolean(), expiresAt: z.number() })

export async function requestKisToken(id: string): Promise<{ issued: boolean; expiresAt: number }> {
  return kisTokenSchema.parse(await api.post(`accounts/${encodeURIComponent(id)}/kis-token`).json())
}

export async function setAccountProduct(id: string, code: string, enabled: boolean): Promise<Account> {
  const path = `accounts/${encodeURIComponent(id)}/products/${encodeURIComponent(code)}`
  return accountSchema.parse(await api.put(path, { json: { enabled } }).json())
}

export async function setProductPlan(id: string, code: string, plan: ProductPlanRequest): Promise<Account> {
  const path = `accounts/${encodeURIComponent(id)}/products/${encodeURIComponent(code)}/plan`
  return accountSchema.parse(await api.put(path, { json: plan }).json())
}
