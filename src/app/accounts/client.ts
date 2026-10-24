import { accountSchema, type Account, type AccountInput } from '../../domain/account.ts'
import { api } from '../http.ts'

export async function listAccounts(): Promise<Account[]> {
  return accountSchema.array().parse(await api.get('accounts').json())
}

export async function createAccount(input: AccountInput): Promise<Account> {
  return accountSchema.parse(await api.post('accounts', { json: input }).json())
}
