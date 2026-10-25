import { expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { setAccountProduct } from '../../../src/app/accounts/client'
import { api } from '../../../src/app/http/http'
vi.mock('../../../src/app/http/http', () => ({ api: { get: vi.fn(), put: vi.fn() } }))
it('requests the encoded account balance path and rejects invalid data', async () => {
  vi.mocked(api.get).mockReturnValue({ json: async () => ({ summary: {}, holdings: [] }) } as never)
  await expect(getStockBalance('a/b')).rejects.toThrow()
  expect(api.get).toHaveBeenCalledWith('accounts/a%2Fb/products/29/balance', expect.anything())
})
it('sets a product with PUT and validates the returned account', async () => {
  const account = { id: 'a', alias: 'a', owner: 'o', accountNumber: '12345678', products: ['29'], productPlans: {}, createdAt: '' }
  vi.mocked(api.put).mockReturnValue({ json: async () => account } as never)
  expect(await setAccountProduct('a/b', '29', true)).toEqual(account)
  expect(api.put).toHaveBeenCalledWith('accounts/a%2Fb/products/29', { json: { enabled: true } })
})
