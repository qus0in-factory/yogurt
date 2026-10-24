import { beforeEach, describe, expect, it, vi } from 'vitest'

const { spawnSync } = vi.hoisted(() => ({ spawnSync: vi.fn(() => ({ status: 0 })) }))
vi.mock('node:child_process', () => ({ spawnSync }))

import { runSecretSetup } from './secret-setup.ts'

const generateSecret = async () => 'k4.secret.test'

describe('secret setup infra', () => {
  beforeEach(() => {
    spawnSync.mockClear()
  })

  it('dev 대상으로 wrangler 인자와 stdin JSON을 전달한다', async () => {
    const exec = vi.fn(() => ({ status: 0 }))
    const result = await runSecretSetup('dev', 'pw', { exec, generateSecret })
    expect(result.exitCode).toBe(0)
    expect(result.message).toContain('LOGIN_PASSWORD')
    expect(result.message).toContain('SESSION_SECRET')
    expect(exec).toHaveBeenCalledWith('wrangler', ['secret', 'bulk', '--config', 'infra/wrangler.jsonc', '--env', 'dev'], { input: JSON.stringify({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'k4.secret.test' }) })
  })

  it('main 대상은 production 환경으로 매핑한다', async () => {
    const exec = vi.fn(() => ({ status: 0 }))
    const result = await runSecretSetup('main', 'pw', { exec, generateSecret })
    expect(result.exitCode).toBe(0)
    expect((exec.mock.calls[0] as any)[1]).toContain('production')
  })

  it('기본 실행기는 stdin만 파이프하고 stdout/stderr는 상속한다', async () => {
    const result = await runSecretSetup('dev', 'pw', { generateSecret })
    expect(result.exitCode).toBe(0)
    expect(spawnSync).toHaveBeenCalledWith('wrangler', ['secret', 'bulk', '--config', 'infra/wrangler.jsonc', '--env', 'dev'], { input: JSON.stringify({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'k4.secret.test' }), stdio: ['pipe', 'inherit', 'inherit'] })
  })

  it('wrangler 실패 시 종료 코드 1을 반환한다', async () => {
    const exec = vi.fn(() => ({ status: 1 }))
    const result = await runSecretSetup('dev', 'pw', { exec, generateSecret })
    expect(result.exitCode).toBe(1)
    expect(exec).toHaveBeenCalledTimes(1)
  })

  it('잘못된 대상은 종료 코드 2이고 실행기를 호출하지 않는다', async () => {
    const exec = vi.fn(() => ({ status: 0 }))
    const result = await runSecretSetup('staging', 'pw', { exec, generateSecret })
    expect(result.exitCode).toBe(2)
    expect(exec).not.toHaveBeenCalled()
  })

  it('대상이 없으면 종료 코드 2이고 실행기를 호출하지 않는다', async () => {
    const exec = vi.fn(() => ({ status: 0 }))
    const result = await runSecretSetup(undefined, 'pw', { exec, generateSecret })
    expect(result.exitCode).toBe(2)
    expect(exec).not.toHaveBeenCalled()
  })

  it('비밀번호가 비어 있으면 종료 코드 2이고 실행기를 호출하지 않는다', async () => {
    const exec = vi.fn(() => ({ status: 0 }))
    const result = await runSecretSetup('dev', '', { exec, generateSecret })
    expect(result.exitCode).toBe(2)
    expect(exec).not.toHaveBeenCalled()
  })
})
