import { accountSchema, type Account, type AccountInput, type AccountUpdate } from '../../domain/accounts/account.ts'
import { api } from '../http/http.ts'

export async function listAccounts(): Promise<Account[]> {
  return accountSchema.array().parse(await api.get('accounts').json())
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
