export type OrderClaim =
  | { outcome: 'claimed' }
  | { outcome: 'processing' }
  | { outcome: 'done'; orderNo: string; acceptedAt: string }
  | { outcome: 'unknown' }

// D1 PRIMARY KEY로 원자적 클레임. KV는 최종 일관이라 동시 요청을 막지 못한다.
// 전이: claimed → sending → succeeded | unknown. failed(KIS 거부 확정)는 행 삭제 후 재시도 허용.
export async function claimOrder(db: D1Database, requestId: string, now = new Date().toISOString()): Promise<OrderClaim> {
  try {
    await db.prepare("INSERT INTO order_claims (request_id, status, created_at) VALUES (?, 'claimed', ?)").bind(requestId, now).run()
    return { outcome: 'claimed' }
  } catch {
    const row = await db.prepare('SELECT status, order_no, accepted_at FROM order_claims WHERE request_id = ?').bind(requestId).first<{ status: string; order_no: string | null; accepted_at: string | null }>()
    if (row?.status === 'succeeded' && row.order_no) {
      return { outcome: 'done', orderNo: row.order_no, acceptedAt: row.accepted_at ?? '' }
    }
    if (row?.status === 'unknown') return { outcome: 'unknown' }
    return { outcome: 'processing' }
  }
}

async function transition(db: D1Database, requestId: string, from: string, set: string, args: unknown[] = []): Promise<boolean> {
  const result = await db.prepare(`UPDATE order_claims SET ${set} WHERE request_id = ? AND status = ?`).bind(...args, requestId, from).run()
  return (result.meta?.changes ?? 0) > 0
}

export function markSending(db: D1Database, requestId: string): Promise<boolean> {
  return transition(db, requestId, 'claimed', "status = 'sending'")
}

export function markSucceeded(db: D1Database, requestId: string, orderNo: string, acceptedAt: string): Promise<boolean> {
  return transition(db, requestId, 'sending', "status = 'succeeded', order_no = ?, accepted_at = ?", [orderNo, acceptedAt])
}

export function markUnknown(db: D1Database, requestId: string): Promise<boolean> {
  return transition(db, requestId, 'sending', "status = 'unknown'")
}

// 'claimed' 상태에서만 해제된다. KIS 요청 전 단계에서만 쓴다.
export async function releaseClaimed(db: D1Database, requestId: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM order_claims WHERE request_id = ? AND status = 'claimed'").bind(requestId).run()
  return (result.meta?.changes ?? 0) > 0
}

// KIS 거부가 확실할 때만 쓴다. sending 상태에서만 해제된다.
export async function releaseSettled(db: D1Database, requestId: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM order_claims WHERE request_id = ? AND status = 'sending'").bind(requestId).run()
  return (result.meta?.changes ?? 0) > 0
}
