type ClaimRow = { status: string; order_no: string | null; accepted_at: string | null; account_id: string | null; product_code: string | null }

export function fakeClaimDb(failures: { update?: boolean; failOn?: string } = {}) {
  const rows = new Map<string, ClaimRow>()
  const db = {
    prepare(sql: string) {
      return {
        bind: (...args: unknown[]) => ({
          run: async () => {
            if (sql.startsWith('UPDATE') && (failures.update || (failures.failOn && sql.includes(failures.failOn)))) throw new Error('D1 write failed')
            if (sql.startsWith('INSERT')) {
              const id = args[0] as string
              if (rows.has(id)) throw new Error('UNIQUE constraint failed: order_claims.request_id')
              rows.set(id, { status: 'claimed', order_no: null, accepted_at: null, account_id: null, product_code: null })
              return { success: true, meta: { changes: 1 } }
            }
            if (sql.startsWith('UPDATE')) {
              const id = args[args.length - 2] as string
              const from = args[args.length - 1] as string
              const row = rows.get(id)
              if (!row || row.status !== from) return { success: true, meta: { changes: 0 } }
              if (sql.includes("status = 'sending'")) row.status = 'sending'
              if (sql.includes("status = 'succeeded'")) { row.status = 'succeeded'; row.order_no = args[0] as string; row.accepted_at = args[1] as string; row.account_id = args[2] as string; row.product_code = args[3] as string }
              if (sql.includes("status = 'unknown'")) row.status = 'unknown'
              return { success: true, meta: { changes: 1 } }
            }
            if (sql.startsWith('DELETE')) {
              const wanted = sql.match(/AND status = '(\w+)'/)?.[1]
              const row = rows.get(args[0] as string)
              if (row && (!wanted || row.status === wanted)) { rows.delete(args[0] as string); return { success: true, meta: { changes: 1 } } }
              return { success: true, meta: { changes: 0 } }
            }
            return { success: true, meta: { changes: 0 } }
          },
          first: async () => {
            if (sql.includes('LIKE') && args.length === 2) {
              const prefix = String(args[0]).replace(/\\(.)/g, '$1').replace(/%$/, '')
              const found = [...rows.entries()].find(([id, r]) => id.startsWith(prefix) && r.order_no === args[1])
              return found ? { status: found[1].status, order_no: found[1].order_no, accepted_at: found[1].accepted_at } : null
            }
            if (args.length === 3) {
              const found = [...rows.values()].find((row) => row.account_id === args[0] && row.product_code === args[1] && row.order_no === args[2])
              return found ? { status: found.status, order_no: found.order_no, accepted_at: found.accepted_at } : null
            }
            const row = rows.get(args[0] as string)
            return row ? { status: row.status, order_no: row.order_no, accepted_at: row.accepted_at } : null
          },
        }),
      }
    },
  } as unknown as D1Database
  return { db, rows }
}
