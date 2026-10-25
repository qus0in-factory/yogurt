// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { fetchStockBalance, KisApiError, type KisAccountClient } from '../../../src/infra/kis/kis-stock-balance'

const holding = {
  pdno: '005930', prdt_name: '삼성전자', hldg_qty: '10', pchs_avg_pric: '70,000',
  pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28',
}
const summaryRow = {
  dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000',
  pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000',
  asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84',
}

const making = (response: unknown) => {
  const request = vi.fn(async (path: string, options: { method: string; trId: string; query?: Record<string, string> }) => {
    expect(path).toBe('/uapi/domestic-stock/v1/trading/inquire-balance')
    expect(options.method).toBe('GET')
    expect(options.trId).toBe('TTTC8434R')
    expect(options.query).toEqual({
      CANO: '12345678', ACNT_PRDT_CD: '29', AFHR_FLPR_YN: 'N', OFL_YN: '', INQR_DVSN: '02', UNPR_DVSN: '01',
      FUND_STTL_ICLD_YN: 'N', FNCG_AMT_AUTO_RDPT_YN: 'N', PRCS_DVSN: '00', CTX_AREA_FK100: '', CTX_AREA_NK100: '',
    })
    return new Response(JSON.stringify(response), { status: 200 })
  })
  return { account: { accountNumber: '12345678', request } as unknown as KisAccountClient, request }
}

describe('fetchStockBalance', () => {
  it('계좌번호·상품코드로 inquire-balance를 요청하고 파싱 결과를 반환한다', async () => {
    const { account, request } = making({ rt_cd: '0', msg_cd: 'OP0007109e-2', msg1: '조회 되었습니다', output1: [holding], output2: [summaryRow] })
    const balance = await fetchStockBalance(account, '29')
    expect(balance.holdings[0].code).toBe('005930')
    expect(balance.summary.cash).toBe(1900000)
    expect(JSON.stringify(balance)).not.toContain('PROTECT-')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('rt_cd가 0이 아니면 KisApiError(msg_cd·msg1)를 던진다', async () => {
    const { account } = making({ rt_cd: '1', msg_cd: 'MF99961011', msg1: '계좌 비밀번호 불일치', output1: [], output2: [] })
    try {
      await fetchStockBalance(account, '29')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(KisApiError)
      expect((error as KisApiError).code).toBe('MF99961011')
      expect((error as KisApiError).message).toBe('계좌 비밀번호 불일치')
    }
  })

  it('rt_cd·msg 필드가 없으면 KisApiError를 던진다', async () => {
    const { account } = making({ unexpected: true })
    try {
      await fetchStockBalance(account, '29')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(KisApiError)
      expect((error as KisApiError).code).toBe('')
      expect((error as KisApiError).message).toBe('')
    }
  })
})
