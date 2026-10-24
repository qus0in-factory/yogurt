// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { SESSION_TTL_SECONDS, deleteSession, hasSession, saveSession } from '../../../src/infra/auth/session-store'

type PutOptions = { expirationTtl?: number }

class FakeKV {
  store = new Map<string, string>()
  puts: Array<{ key: string; value: string; options?: PutOptions }> = []

  async put(key: string, value: string, options?: PutOptions): Promise<void> {
    this.puts.push({ key, value, options })
    this.store.set(key, value)
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}

const makeKv = () => new FakeKV() as unknown as KVNamespace
const fake = (kv: KVNamespace) => kv as unknown as FakeKV

describe('session store', () => {
  it('세션을 해시 키와 7일 TTL로 저장한다', async () => {
    const kv = makeKv()
    await saveSession(kv, 'raw-token-value')
    const put = fake(kv).puts[0]
    expect(put.key).toMatch(/^session:[0-9a-f]{64}$/)
    expect(put.key).not.toContain('raw-token-value')
    expect(put.value).toBe('1')
    expect(put.options).toEqual({ expirationTtl: 604800 })
    expect(SESSION_TTL_SECONDS).toBe(604800)
  })

  it('저장된 토큰만 세션이 있고 삭제 후에는 없다', async () => {
    const kv = makeKv()
    expect(await hasSession(kv, 'token-a')).toBe(false)
    await saveSession(kv, 'token-a')
    expect(await hasSession(kv, 'token-a')).toBe(true)
    expect(await hasSession(kv, 'token-b')).toBe(false)
    await deleteSession(kv, 'token-a')
    expect(await hasSession(kv, 'token-a')).toBe(false)
    expect(fake(kv).store.size).toBe(0)
  })

  it('삭제는 해시 키를 대상으로 하고 토큰 원문을 키로 쓰지 않는다', async () => {
    const kv = makeKv()
    await saveSession(kv, 'secret-token')
    const key = [...fake(kv).store.keys()][0]
    expect(key).toMatch(/^session:[0-9a-f]{64}$/)
    await deleteSession(kv, 'secret-token')
    expect(fake(kv).store.has(key)).toBe(false)
    expect([...fake(kv).store.keys()].every((stored) => stored !== 'secret-token')).toBe(true)
  })
})
