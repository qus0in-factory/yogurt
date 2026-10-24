import { describe, expect, it } from 'vitest'
import { accountInputSchema, accountSchema, maskKey } from './account'

describe('account schemas', () => {
  it('계좌 입력은 별칭·access key·secret key를 요구하고 공백을 정리한다', () => {
    const parsed = accountInputSchema.parse({ alias: ' 주식 ', accessKey: ' ak ', secretKey: ' sk ' })
    expect(parsed).toEqual({ alias: '주식', accessKey: 'ak', secretKey: 'sk' })
    expect(accountInputSchema.safeParse({ alias: '', accessKey: 'ak', secretKey: 'sk' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ alias: 'a', accessKey: '', secretKey: 'sk' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ alias: 'a', accessKey: 'ak', secretKey: ' ' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ alias: 'a'.repeat(31), accessKey: 'ak', secretKey: 'sk' }).success).toBe(false)
  })

  it('계좌 응답은 secret key 없이 마스킹된 access key만 담는다', () => {
    const account = { id: 'id-1', alias: '주식', accessKeyMasked: '••••abcd', createdAt: '2026-10-24T09:00:00.000Z' }
    expect(accountSchema.parse(account)).toEqual(account)
    expect(accountSchema.parse({ ...account, secretKey: 'sk' })).not.toHaveProperty('secretKey')
  })

  it('키는 끝 4자리만 남기고 가린다', () => {
    expect(maskKey('PSabcd1234')).toBe('••••1234')
    expect(maskKey('abc')).toBe('••••')
  })
})
