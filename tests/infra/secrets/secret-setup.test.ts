import { beforeEach, describe, expect, it, vi } from 'vitest'

const { spawnSync } = vi.hoisted(() => ({ spawnSync: vi.fn(() => ({ status: 0 })) }))
vi.mock('node:child_process', () => ({ spawnSync }))
import { runSecretSetup } from '../../../src/infra/secrets/secret-setup.ts'

type Exec = (command: string, args: string[], options: { input: string }) => { status: number }
const successfulExec = () => vi.fn<Exec>(() => ({ status: 0 }))
const generateSecret = vi.fn(async () => 'k4.secret.test')
const setup = (target: string | undefined, password: string | undefined, deps = {}) =>
  runSecretSetup(target, password, { generateSecret, ...deps })

describe('secret setup infra', () => {
  beforeEach(() => { spawnSync.mockClear(); generateSecret.mockClear() })

  it('dev 대상으로 wrangler 인자와 stdin JSON을 전달한다', async () => {
    const exec = successfulExec()
    const result = await setup('dev', 'pw', { exec })
    expect(result.exitCode).toBe(0)
    expect(exec).toHaveBeenCalledWith('wrangler', ['secret', 'bulk', '--config', 'infra/wrangler.jsonc', '--env', 'dev'], { input: JSON.stringify({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'k4.secret.test' }) })
  })

  it('main을 production에 등록한다', async () => {
    const exec = successfulExec()
    await setup('main', 'pw', { exec })
    expect((exec.mock.calls[0] as any)[1]).toContain('production')
  })

  it('인자 없이 입력받은 비밀번호로 두 환경에 각각 새 secret을 등록한다', async () => {
    const exec = successfulExec()
    const promptPassword = vi.fn(async () => ({ password: 'pw', confirmation: 'pw' }))
    generateSecret.mockResolvedValueOnce('dev-key').mockResolvedValueOnce('main-key')
    const result = await setup(undefined, undefined, { exec, promptPassword })
    expect(result.exitCode).toBe(0)
    expect(exec.mock.calls.map(call => call[1].at(-1))).toEqual(['dev', 'production'])
    expect(exec.mock.calls.map(call => call[2].input)).toEqual([
      JSON.stringify({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'dev-key' }),
      JSON.stringify({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'main-key' }),
    ])
    expect(promptPassword).toHaveBeenCalledOnce()
  })

  it('환경 변수 비밀번호가 있으면 입력을 요청하지 않는다', async () => {
    const promptPassword = vi.fn()
    expect((await setup('dev', 'pw', { promptPassword })).exitCode).toBe(0)
    expect(promptPassword).not.toHaveBeenCalled()
  })

  it('두 번째 환경이 실패하면 중단하고 등록 완료 환경을 표시한다', async () => {
    const exec = successfulExec().mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 1 })
    const result = await setup(undefined, 'pw', { exec })
    expect(result).toMatchObject({ exitCode: 1, message: expect.stringContaining('registered: dev') })
    expect(exec).toHaveBeenCalledTimes(2)
    expect(result.message).not.toContain('pw')
  })

  it('기본 실행기는 stdin만 파이프한다', async () => {
    expect((await setup('dev', 'pw')).exitCode).toBe(0)
    expect(spawnSync).toHaveBeenCalledWith('wrangler', ['secret', 'bulk', '--config', 'infra/wrangler.jsonc', '--env', 'dev'], { input: JSON.stringify({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'k4.secret.test' }), stdio: ['pipe', 'inherit', 'inherit'] })
  })

  it.each(['staging', ''])('잘못된 대상 %s는 exit 2이고 실행하지 않는다', async target => {
    const exec = successfulExec()
    expect((await setup(target, 'pw', { exec })).exitCode).toBe(2)
    expect(exec).not.toHaveBeenCalled()
  })

  it.each([
    { password: '', confirmation: '' }, { password: 'pw', confirmation: 'other' },
  ])('빈 값이나 불일치는 exit 2이고 실행하지 않는다', async credentials => {
    const exec = successfulExec()
    const promptPassword = vi.fn(async () => credentials)
    expect((await setup('dev', undefined, { exec, promptPassword })).exitCode).toBe(2)
    expect(exec).not.toHaveBeenCalled()
  })
})
