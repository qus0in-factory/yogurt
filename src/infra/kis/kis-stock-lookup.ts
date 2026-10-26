import type { KisAccountClient } from './kis-stock-balance.ts'

export const KIS_NAME_FIELD = 'hts_kor_isnm' as const

const INQUIRE_PRICE_PATH = '/uapi/domestic-stock/v1/quotations/inquire-price'
const INQUIRE_PRICE_TR_ID = 'FHKST01010100'
const MARKET_DIVISION_CODE = 'J'
const MAX_STOCK_NAME_LENGTH = 80

export class KisStockNotFoundError extends Error {
  readonly code = 'STOCK_NOT_FOUND'
  constructor() {
    super('Stock not found')
    this.name = 'KisStockNotFoundError'
  }
}

export class KisStockLookupUnavailableError extends Error {
  readonly code = 'STOCK_LOOKUP_UNAVAILABLE'
  constructor() {
    super('Stock lookup unavailable')
    this.name = 'KisStockLookupUnavailableError'
  }
}

type RawQuoteResponse = {
  rt_cd?: string
  output?: Record<string, unknown> | null
}

export async function lookupStockName(
  client: Pick<KisAccountClient, 'request'>,
  code: string,
): Promise<string> {
  let response: Response
  try {
    response = await client.request(INQUIRE_PRICE_PATH, {
      method: 'GET',
      trId: INQUIRE_PRICE_TR_ID,
      query: {
        FID_COND_MRKT_DIV_CODE: MARKET_DIVISION_CODE,
        FID_INPUT_ISCD: code,
      },
    })
  } catch {
    throw new KisStockLookupUnavailableError()
  }

  if (!response.ok) {
    throw new KisStockLookupUnavailableError()
  }

  let raw: RawQuoteResponse
  try {
    raw = (await response.json()) as RawQuoteResponse
  } catch {
    throw new KisStockLookupUnavailableError()
  }

  if (raw.rt_cd !== '0') {
    throw new KisStockNotFoundError()
  }

  const rawName = raw.output?.[KIS_NAME_FIELD]
  const name = typeof rawName === 'string' ? rawName.trim().slice(0, MAX_STOCK_NAME_LENGTH) : ''
  if (!name) {
    throw new KisStockNotFoundError()
  }

  return name
}
