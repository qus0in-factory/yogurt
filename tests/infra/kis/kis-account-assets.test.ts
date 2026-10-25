// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { fetchAccountAssets } from '../../../src/infra/kis/kis-account-assets'
import { KisApiError, type KisAccountClient } from '../../../src/infra/kis/kis-stock-balance'

const summary = { tot_asst_amt: '100', nass_tot_amt: '90', evlu_amt_smtl: '80',
  pchs_amt_smtl: '70', evlu_pfls_amt_smtl: '10', loan_amt_smtl: '10',
  dncl_amt: '20', tot_dncl_amt: '30', cma_evlu_amt: '40', frcr_evlu_tota: '50' }
function setup(body: unknown) {
  const request = vi.fn<KisAccountClient['request']>().mockResolvedValue(Response.json(body))
  return { account: { accountNumber: '12345678', request }, request }
}
it('CTRP6548R의 경로·계좌·상품·빈 쿼리를 보내고 자산 현황을 반환한다', async () => {
  const { account, request } = setup({ rt_cd: '0', output1: [], output2: summary })
  const result = await fetchAccountAssets(account, '29')
  expect(request).toHaveBeenCalledExactlyOnceWith('/uapi/domestic-stock/v1/trading/inquire-account-balance', {
    method: 'GET', trId: 'CTRP6548R', query: {
      CANO: '12345678', ACNT_PRDT_CD: '29', INQR_DVSN_1: '', BSPR_BF_DT_APLY_YN: '',
    },
  })
  expect(result.rows).toEqual([])
  expect(result.summary.deposit).toBe(20)
  expect(result.summary.totalDeposit).toBe(30)
})
it.each(['1', undefined])('rt_cd=%s이면 기존 KisApiError로 실패한다', async rt_cd => {
  const { account } = setup({ rt_cd, msg_cd: 'ERR', msg1: 'KIS message' })
  await expect(fetchAccountAssets(account, '29')).rejects.toBeInstanceOf(KisApiError)
  await expect(fetchAccountAssets(setup({ rt_cd, msg_cd: 'ERR' }).account, '29'))
    .rejects.toMatchObject({ code: 'ERR' })
})
it('성공 코드여도 합계가 잘못되면 파싱 오류를 전달한다', async () => {
  await expect(fetchAccountAssets(setup({ rt_cd: '0', output1: [], output2: [] }).account, '29')).rejects.toThrow()
})
