import { expect, it, vi } from 'vitest'
import { fetchOrderFill } from '../../../src/infra/kis/kis-order-status'

it.each(['ord_qty', 'tot_ccld_qty', 'rmn_qty'])('%s가 누락/비숫자이면 unknown이다', async (field) => {
  for (const value of [undefined, '', 'bad', null, false]) {
    const row = { odno: 'O-1', ord_qty: '10', tot_ccld_qty: '4', rmn_qty: '0', [field]: value }
    const request = vi.fn(async () => new Response(JSON.stringify({ rt_cd: '0', output1: [row] })))
    expect(await fetchOrderFill({ accountNumber: '1234567801', request }, '01', 'O-1', '')).toBeNull()
  }
})
