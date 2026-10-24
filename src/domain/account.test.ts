import { describe, expect, it } from 'vitest'
import { accountInputSchema, accountSchema } from './account'

const valid = { alias: '주식', accountNumber: '12345678-01', accessKey: 'ak', secretKey: 'sk' }

describe('account schemas', () => {
  it('계좌 입력은 별칭·계좌번호·access key·secret key를 요구하고 공백을 정리한다', () => {
    const parsed = accountInputSchema.parse({ alias: ' 주식 ', accountNumber: ' 12345678-01 ', accessKey: ' ak ', secretKey: ' sk ' })
    expect(parsed).toEqual(valid)
    expect(accountInputSchema.safeParse({ ...valid, alias: '' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, alias: 'a'.repeat(31) }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, accessKey: '' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, secretKey: ' ' }).success).toBe(false)
  })

  it('계좌번호는 숫자와 하이픈 4~30자만 허용한다', () => {
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '1234' }).success).toBe(true)
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '123' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '1234-ab' }).success).toBe(false)
  })

  it('계좌 응답은 별칭·계좌번호만 평문으로 담고 키는 담지 않는다', () => {
    const account = { id: 'id-1', alias: '주식', accountNumber: '12345678-01', createdAt: '2026-10-24T09:00:00.000Z' }
    expect(accountSchema.parse(account)).toEqual(account)
    const parsed = accountSchema.parse({ ...account, accessKey: 'ak', secretKey: 'sk' })
    expect(parsed).not.toHaveProperty('accessKey')
    expect(parsed).not.toHaveProperty('secretKey')
  })
})
