import type { KisAccountClient } from './kis-stock-balance.ts'

export const KIS_NAME_FIELDS = ['prdt_abrv_name', 'prdt_name'] as const
export const KIS_NAME_FIELD = KIS_NAME_FIELDS[0]
export const SEARCH_STOCK_INFO_PATH = '/uapi/domestic-stock/v1/quotations/search-stock-info' as const
export const SEARCH_STOCK_INFO_TR_ID = 'CTPF1002R' as const
export const DOMESTIC_STOCK_PRDT_TYPE_CD = '300' as const
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

type RawStockInfoResponse = {
  rt_cd?: string
  msg_cd?: string
  msg1?: string
  output?: Record<string, unknown> | null
}

type StockNotFoundLog =
  | { reason: 'rt_cd'; rt_cd: string | undefined; msg_cd: string | undefined; msg1: string | undefined }
  | { reason: 'empty_name'; outputKeys: string[] }

function logStockNotFound(entry: StockNotFoundLog): void {
  console.warn(entry)
}

function extractStockName(output: Record<string, unknown> | null | undefined): string {
  if (!output || typeof output !== 'object') return ''
  for (const field of KIS_NAME_FIELDS) {
    const rawValue = output[field]
    const trimmed = typeof rawValue === 'string' ? rawValue.trim() : ''
    if (trimmed) return trimmed.slice(0, MAX_STOCK_NAME_LENGTH)
  }
  return ''
}

export async function lookupStockName(
  client: Pick<KisAccountClient, 'request'>,
  code: string,
): Promise<string> {
  let raw: RawStockInfoResponse
  try {
    const response = await client.request(SEARCH_STOCK_INFO_PATH, {
      method: 'GET',
      trId: SEARCH_STOCK_INFO_TR_ID,
      query: { PDNO: code, PRDT_TYPE_CD: DOMESTIC_STOCK_PRDT_TYPE_CD },
    })
    if (!response.ok) throw new KisStockLookupUnavailableError()
    raw = (await response.json()) as RawStockInfoResponse
  } catch {
    throw new KisStockLookupUnavailableError()
  }

  if (raw.rt_cd !== '0') {
    logStockNotFound({ reason: 'rt_cd', rt_cd: raw.rt_cd, msg_cd: raw.msg_cd, msg1: raw.msg1 })
    throw new KisStockNotFoundError()
  }

  const name = extractStockName(raw.output)
  if (!name) {
    const outputKeys = raw.output && typeof raw.output === 'object' ? Object.keys(raw.output) : []
    logStockNotFound({ reason: 'empty_name', outputKeys })
    throw new KisStockNotFoundError()
  }
  return name
}
