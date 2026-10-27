import { afterEach, beforeEach, vi } from 'vitest'

// 월요일 10:00 KST (장 운영 시간). Date만 고정하고 타이머는 그대로 둔다.
const OPEN_AT = new Date('2026-10-26T01:00:00Z').getTime()

export function pinOpenMarket() {
  beforeEach(() => { vi.useFakeTimers({ now: OPEN_AT, toFake: ['Date'] }) })
  afterEach(() => { vi.useRealTimers() })
}
