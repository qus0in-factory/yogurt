import { z } from 'zod'
import { HTTPError } from 'ky'
import type { OrderExecutionOutput } from './orders-client'

export const checkResponseSchema = z.object({ availableQty: z.number(), availableWon: z.number() })
export const orderResponseSchema = z.object({ orderNo: z.string(), acceptedAt: z.string().optional() })

export const orderPath = (accountId: string, productCode: string, action: 'check' | '') =>
  `accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productCode)}/orders${action === 'check' ? '/check' : ''}`

export function newRequestId(): string {
  const random = Math.random().toString(36).slice(2, 10)
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `req-${Date.now()}-${random}`
}

export function toFailure(status: number, body: unknown): Pick<OrderExecutionOutput, 'failureCode' | 'message' | 'reason' | 'nextOpenAt'> {
  const code = typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string' ? body.code : null
  const reason = typeof body === 'object' && body !== null && 'reason' in body && typeof body.reason === 'string' ? body.reason : undefined
  const nextOpenAt = typeof body === 'object' && body !== null && 'nextOpenAt' in body && typeof body.nextOpenAt === 'string' ? body.nextOpenAt : undefined
  if (status === 404) return { failureCode: 'ACCOUNT_NOT_FOUND', message: '계좌를 찾을 수 없습니다.' }
  if (status === 409) return { failureCode: 'ORDER_IN_PROGRESS', message: '주문이 처리 중입니다. 잠시 후 같은 화면에서 확인하세요.' }
  if (status === 502 || status === 503) return { failureCode: code ?? 'ORDER_UNAVAILABLE', message: '주문 서버에 일시 장애가 있습니다.' }
  return { failureCode: code ?? 'ORDER_FAILED', message: '주문에 실패했습니다.', reason, nextOpenAt }
}

// HTTP 오류 응답 본문을 읽는다. JSON이 아니면 text로 읽고 버린다. 본문 값은 로그에 찍지 않는다.
export async function readHttpErrorBody(response: Response): Promise<unknown> {
  let text = ''
  try {
    text = await response.text()
  } catch {
    return undefined
  }
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

// 본문의 code·stage·kisCode 등을 오류의 data 필드에 붙인다.
// ky는 HTTP 오류 본문을 미리 읽어 error.data에 넣어 두므로(바디 소진됨) 그 값을 우선 살린다.
export async function withHttpErrorData(error: unknown): Promise<unknown> {
  if (error instanceof HTTPError && (error as { data?: unknown }).data === undefined) {
    const body = await readHttpErrorBody(error.response)
    if (body !== undefined) (error as { data?: unknown }).data = body
  }
  return error
}
