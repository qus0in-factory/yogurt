// @vitest-environment node
import { describe, expect, it } from 'vitest'
import app from '../../src/infra/worker.ts'
import packageJson from '../../package.json'

const fakeSessions = (() => { const store = new Map<string,string>(); return { get: async (k:string) => store.get(k) ?? null, put: async (k:string,v:string) => { store.set(k,v) }, delete: async (k:string) => { store.delete(k) }, list: async () => ({ keys: [] }), getWithMetadata: async (k:string) => ({ value: store.get(k) ?? null, metadata: null }) } })() as unknown as KVNamespace
const makeEnv = (password?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, SESSIONS: fakeSessions, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env

describe('health', () => {
  it('/health는 인증 없이 패키지 버전과 200을 반환한다', async () => {
    const res = await app.fetch(new Request('https://example.com/health'), makeEnv())
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ version: packageJson.version })
  })

  it('/api/health는 인증 없이 패키지 버전과 200을 반환한다', async () => {
    const res = await app.fetch(new Request('https://example.com/api/health'), makeEnv('secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ version: packageJson.version })
  })
})
