import { describe, expect, it } from 'vitest'
import { createBulkPayload, resolveTarget, validateLoginPassword } from './secret-setup'

describe('secret setup domain', () => {
  it('dev 인자를 해석한다', () => {
    expect(resolveTarget('dev')).toEqual({ target: 'dev', env: 'dev' })
  })

  it('main 인자를 production으로 해석한다', () => {
    expect(resolveTarget('main')).toEqual({ target: 'main', env: 'production' })
  })

  it('잘못된 인자는 null이다', () => {
    expect(resolveTarget('staging')).toBeNull()
    expect(resolveTarget(undefined)).toBeNull()
    expect(resolveTarget('')).toBeNull()
  })

  it('비밀번호가 비어 있으면 오류 메시지를 반환한다', () => {
    expect(validateLoginPassword('')).toBeTruthy()
    expect(validateLoginPassword(undefined)).toBeTruthy()
    expect(validateLoginPassword('pw')).toBeNull()
  })

  it('bulk JSON에 두 키를 담는다', () => {
    const payload = JSON.parse(createBulkPayload('pw', 'secret'))
    expect(payload).toEqual({ LOGIN_PASSWORD: 'pw', SESSION_SECRET: 'secret' })
  })
})
