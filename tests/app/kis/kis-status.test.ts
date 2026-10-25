import { describe, expect, it } from 'vitest'
import { parseKisStatus } from '../../../src/app/kis/kis-status'

describe('parseKisStatus', () => {
  it('SSE data JSON을 연결 상태로 검증한다', () => {
    expect(parseKisStatus('{"accountId":"a1","status":"connected","expiresAt":123}'))
      .toEqual({ accountId: 'a1', status: 'connected', expiresAt: 123 })
  })

  it('expiresAt은 선택이고 알 수 없는 필드는 제거한다', () => {
    expect(parseKisStatus('{"accountId":"a1","status":"error","token":"x"}'))
      .toEqual({ accountId: 'a1', status: 'error' })
  })

  it('유효하지 않은 JSON·ping·알 수 없는 상태·필드 타입은 null이다', () => {
    expect(parseKisStatus('{bad json')).toBeNull()
    expect(parseKisStatus('ping')).toBeNull()
    expect(parseKisStatus('{"accountId":"a1","status":"other"}')).toBeNull()
    expect(parseKisStatus('{"accountId":42,"status":"connected"}')).toBeNull()
  })

  it('만료 값은 숫자만 받는다', () => {
    expect(parseKisStatus('{"accountId":"a1","status":"connected","expiresAt":"soon"}')).toBeNull()
  })
})
