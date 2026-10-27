export type FillUpdate = {
  orderId: string
  status: 'filled' | 'closed_partial' | 'partial' | 'open' | 'cancelled' | 'unknown'
  filledQty: number
  remainingQty: number
  checkedAt: string
}

export type FillSource = {
  addEventListener: (type: string, listener: (event: { data: string }) => void) => void
  close: () => void
}

// 자동 재연결은 하지 않는다(중복 조회 방지). 끊기면 화면이 재구독한다.
export type FillStreamError =
  | { kind: 'transport' }
  | { kind: 'message'; raw: string }
  | { kind: 'unknown'; update: FillUpdate }

const openSource = (url: string): FillSource | null =>
  typeof EventSource === 'undefined' ? null : new EventSource(url)

// 화면은 gf가 다음 단계에서 연결한다. 구독 해제는 반환된 함수를 호출한다.
export function subscribeFills(
  query: { accountId: string; productCode: string; orderIds: string[] },
  onUpdate: (update: FillUpdate) => void,
  onDone?: (finished: string[]) => void,
  onError?: (error: FillStreamError) => void,
  createSource: ((url: string) => FillSource | null) | null = openSource,
): () => void {
  const params = new URLSearchParams({ orderIds: query.orderIds.join(',') })
  const source = createSource ? createSource(`/api/accounts/${encodeURIComponent(query.accountId)}/products/${encodeURIComponent(query.productCode)}/orders/stream?${params.toString()}`) : null
  const close = () => source?.close()
  if (!source) {
    onError?.({ kind: 'transport' })
    return close
  }
  source.addEventListener('fill', ({ data }) => {
    try {
      const update = JSON.parse(data) as FillUpdate
      onUpdate(update)
      if (update.status === 'unknown') onError?.({ kind: 'unknown', update })
    } catch {
      onError?.({ kind: 'message', raw: data })
    }
  })
  source.addEventListener('error', () => {
    close()
    onError?.({ kind: 'transport' })
  })
  source.addEventListener('done', ({ data }) => {
    try {
      onDone?.((JSON.parse(data) as { finished: string[] }).finished ?? [])
    } catch {
      onDone?.([])
      onError?.({ kind: 'message', raw: data })
    }
    close()
  })
  return close
}
