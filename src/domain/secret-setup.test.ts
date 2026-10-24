import { describe, expect, it } from 'vitest'
import { createBulkPayload, resolveTargets, validateLoginPassword } from './secret-setup'

describe('secret setup domain', () => {
  it('dev 인자를 해석한다', () => {
    expect(resolveTargets('dev')).toEqual([{ target: 'dev', env: 'dev' }])
  })

  it('main 인자를 production으로 해석한다', () => {
    expect(resolveTargets('main')).toEqual([{ target: 'main', env: 'production' }])
  })

  it('인자가 없으면 dev와 production을 모두 해석한다', () => {
    expect(resolveTargets(undefined)).toEqual([
      { target: 'dev', env: 'dev' }, { target: 'main', env: 'production' },
    ])
  })

  it('잘못된 인자는 null이다', () => {
    expect(resolveTargets('staging')).toBeNull()
    expect(resolveTargets('')).toBeNull()
  })

  it('비밀번호가 비어 있으면 오류 메시지를 반환한다', () => {
    expect(validateLoginPassword('')).toBeTruthy()
    expect(validateLoginPassword(undefined)).toBeTruthy()
    expect(validateLoginPassword('pw', 'pw')).toBeNull()
    expect(validateLoginPassword('pw', 'other')).toContain('match')
  })

  it('bulk JSON에 두 키를 담는다', () => {
    const payload = JSON.parse(createBulkPayload('pw', 'secret'))
    expect(payload).toEqual({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'secret' })
  })
})
