// 같은 요청 안의 KIS 호출을 직렬화하고 호출 사이 최소 간격을 둔다.
// 주문이 가장 먼저, 읽기가 다음, 체결 조회가 마지막이다.
// Workers에서 요청을 넘어 Promise를 이어 붙이면 경고·취소가 나므로,
// 모듈 전역 공유 체인은 두지 않고 클라이언트마다(요청마다) 새로 만든다.
// 요청 사이 간격은 두지 않고 EGW00201 지수 백오프 재시도에 맡긴다.
export const KIS_MIN_INTERVAL_MS = 200
export const KIS_MAX_READ_ATTEMPTS = 3

export type KisQueuePriority = 'order' | 'read' | 'fill'

export type KisQueue = {
  run: <T>(priority: KisQueuePriority, task: () => Promise<T>) => Promise<T>
}

type QueueDeps = {
  minIntervalMs?: number
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}

type Entry = { execute: () => void; settled: Promise<void> }

export function createKisQueue(deps: QueueDeps = {}): KisQueue {
  const minIntervalMs = deps.minIntervalMs ?? KIS_MIN_INTERVAL_MS
  const now = deps.now ?? Date.now
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const lanes: Record<KisQueuePriority, Entry[]> = { order: [], read: [], fill: [] }
  let lastStart: number | null = null
  let pumping = false
  async function pump(): Promise<void> {
    if (pumping) return
    pumping = true
    try {
      for (;;) {
        const entry = lanes.order.shift() ?? lanes.read.shift() ?? lanes.fill.shift()
        if (!entry) return
        if (lastStart !== null) {
          const elapsed = now() - lastStart
          if (elapsed < minIntervalMs) await sleep(minIntervalMs - elapsed)
        }
        lastStart = now()
        entry.execute()
        await entry.settled
      }
    } finally {
      pumping = false
    }
  }
  return {
    run(priority, task) {
      return new Promise((resolve, reject) => {
        let resolveSettled!: () => void
        const settled = new Promise<void>((r) => { resolveSettled = r })
        const execute = () => {
          task().then(
            (value) => { resolve(value); resolveSettled() },
            (error) => { reject(error); resolveSettled() },
          )
        }
        lanes[priority].push({ execute, settled })
        void pump()
      })
    },
  }
}

