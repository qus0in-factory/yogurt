import { HTTPError } from 'ky'

export type PortfolioIssue = {
  path: string | (string | number)[]
  reason?: string
  message?: string
  [key: string]: unknown
}

export class PortfolioApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly issues: PortfolioIssue[]
  readonly body: Record<string, unknown> | null

  constructor(cause: HTTPError, body: Record<string, unknown> | null) {
    super(`Portfolio API request failed (${cause.response.status})`, { cause })
    this.name = 'PortfolioApiError'
    this.status = cause.response.status
    this.body = body
    this.code = typeof body?.code === 'string' ? body.code : undefined
    this.issues = Array.isArray(body?.issues) ? body.issues : []
  }
}

export async function portfolioRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (!(error instanceof HTTPError)) throw error
    const payload: unknown = error.data
    const body = payload !== null && typeof payload === 'object' && !Array.isArray(payload)
      ? payload as Record<string, unknown> : null
    throw new PortfolioApiError(error, body)
  }
}
