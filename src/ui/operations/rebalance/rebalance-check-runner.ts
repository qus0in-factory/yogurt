import { checkPreOrder, type PreOrderCheckOutput } from '../../../app/trading/orders-client'
import { formatNextOpenTime } from '../../../app/market/format-time'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { marketText } from '../../glossary/market'
import { rebalanceText } from '../../glossary/rebalance'
import { checkFailureData, type RebalanceCheckFailure } from './rebalance-check-failure'
import { retryRateLimitedCheck } from './rebalance-check-retry'

export type AdjustedInfo = { requested: number; available: number }

export type CheckOutcome = {
  qty: number
  check: PreOrderCheckOutput | null
  error: string | null
  checkFailure: RebalanceCheckFailure | null
  exceedAvailable: number | null
  adjusted: AdjustedInfo | null
}

export const toClosedMsg = (reason?: string, time?: string) =>
  marketText.dialogClosed(marketText.reasons[reason ?? 'closed-hours'] ?? marketText.reasons['closed-hours'], time ? formatNextOpenTime(time) : undefined)

type CheckParams = { item: RebalanceItem; accountId: string; productCode: string; price: number; quantity: number }

export async function runRebalanceCheck(params: CheckParams, isCancelled: () => boolean = () => false): Promise<CheckOutcome> {
  return retryRateLimitedCheck(() => runRebalanceCheckOnce(params), isCancelled)
}

async function runRebalanceCheckOnce(params: CheckParams): Promise<CheckOutcome> {
  const { item, accountId, productCode, price } = params
  const side = item.side === 'sell' ? 'sell' : 'buy'
  const requestQty = params.quantity
  let qty = requestQty
  let exceedAvailable: number | null = null
  let adjusted: AdjustedInfo | null = null
  try {
    const result = await checkPreOrder({ accountId, productCode, code: item.code, side, quantity: requestQty, price })
    return { qty: requestQty, check: result, error: null, checkFailure: null, exceedAvailable: null, adjusted: null }
  } catch (err) {
    const data = checkFailureData(err)
    if (data?.code === 'MARKET_CLOSED') {
      return { qty: requestQty, check: null, error: toClosedMsg(typeof data.reason === 'string' ? data.reason : undefined, typeof data.nextOpenAt === 'string' ? data.nextOpenAt : undefined), checkFailure: null, exceedAvailable: null, adjusted: null }
    }
    if (data?.code === 'ORDER_QUANTITY_EXCEEDED') {
      const available = Number(data.availableQty)
      const requested = Number(data.requestedQty)
      const safeAvailable = Number.isFinite(available) ? available : 0
      const safeRequested = Number.isFinite(requested) ? requested : requestQty
      if (safeAvailable > 0) {
        qty = safeAvailable
        exceedAvailable = safeAvailable
        adjusted = { requested: safeRequested, available: safeAvailable }
        try {
          const retry = await checkPreOrder({ accountId, productCode, code: item.code, side, quantity: safeAvailable, price })
          return { qty, check: retry, error: null, checkFailure: null, exceedAvailable, adjusted }
        } catch (retryErr) {
          const retryData = checkFailureData(retryErr)
          if (retryData?.code === 'MARKET_CLOSED') {
            return { qty, check: null, error: toClosedMsg(typeof retryData.reason === 'string' ? retryData.reason : undefined, typeof retryData.nextOpenAt === 'string' ? retryData.nextOpenAt : undefined), checkFailure: null, exceedAvailable, adjusted }
          }
          if (retryData?.code === 'ORDER_QUANTITY_EXCEEDED') {
            return { qty, check: null, error: rebalanceText.error.noAvailableQuantity, checkFailure: null, exceedAvailable: 0, adjusted }
          }
          return { qty, check: null, error: rebalanceText.error.checkFailed, checkFailure: { stage: typeof retryData?.stage === 'string' ? retryData.stage : undefined, kisCode: typeof retryData?.kisCode === 'string' ? retryData.kisCode : undefined, kisMessage: typeof retryData?.kisMessage === 'string' ? retryData.kisMessage : undefined }, exceedAvailable: 0, adjusted }
        }
      }
      return { qty: requestQty, check: null, error: rebalanceText.error.noAvailableQuantity, checkFailure: null, exceedAvailable: 0, adjusted: null }
    }
    return { qty: requestQty, check: null, error: rebalanceText.error.checkFailed, checkFailure: { stage: typeof data?.stage === 'string' ? data.stage : undefined, kisCode: typeof data?.kisCode === 'string' ? data.kisCode : undefined, kisMessage: typeof data?.kisMessage === 'string' ? data.kisMessage : undefined }, exceedAvailable: null, adjusted: null }
  }
}