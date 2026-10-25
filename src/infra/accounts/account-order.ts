export async function reorderAccountIds(db: D1Database, ids: string[]): Promise<boolean> {
  const { results = [] } = await db.prepare('SELECT id FROM accounts').all<{ id: string }>()
  const currentIds = new Set(results.map(account => account.id))
  if (!ids.length || ids.length !== currentIds.size || new Set(ids).size !== ids.length ||
      ids.some(id => !currentIds.has(id))) return false
  await db.batch(ids.map((id, index) =>
    db.prepare('UPDATE accounts SET sort_order = ? WHERE id = ?').bind(index, id)))
  return true
}
