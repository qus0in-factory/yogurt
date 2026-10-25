import { parseAccountAssets } from '../../domain/kis/account-assets.ts'
import { KisApiError, type KisAccountClient } from './kis-stock-balance.ts'

const PATH = '/uapi/domestic-stock/v1/trading/inquire-account-balance'
type RawResponse = { rt_cd?: string; msg_cd?: string; msg1?: string }

export async function fetchAccountAssets(account: KisAccountClient, productCode: string) {
  const response = await account.request(PATH, {
    method: 'GET', trId: 'CTRP6548R',
    query: {
      CANO: account.accountNumber, ACNT_PRDT_CD: productCode,
      INQR_DVSN_1: '', BSPR_BF_DT_APLY_YN: '',
    },
  })
  const raw = await response.json() as RawResponse
  if (raw.rt_cd !== '0') throw new KisApiError(raw.msg_cd ?? '', raw.msg1 ?? '')
  return parseAccountAssets(raw)
}
