import { KIS_RATE_LIMIT_CODES } from '../../../domain/trading/kis-rate-limit'
import type { CheckOutcome } from './rebalance-check-runner'

const DELAYS = [1000, 2000] as const

export async function retryRateLimitedCheck(run: () => Promise<CheckOutcome>, isCancelled: () => boolean = () => false): Promise<CheckOutcome> {
  let outcome = await run()
  for (const delay of DELAYS) {
    const code = outcome.checkFailure?.kisCode
    if (isCancelled() || !code || !KIS_RATE_LIMIT_CODES.has(code)) return outcome
    await new Promise<void>((resolve) => setTimeout(resolve, delay))
    if (isCancelled()) return outcome
    outcome = await run()
  }
  return outcome
}
