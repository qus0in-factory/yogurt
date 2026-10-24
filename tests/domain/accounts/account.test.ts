import { describe, expect, it } from 'vitest'
import { accountInputSchema, accountSchema, accountUpdateSchema } from '../../../src/domain/accounts/account'

const valid = { alias: '주식', owner: '홍길동', accountNumber: '12345678-01', accessKey: 'ak', secretKey: 'sk' }
const messages = (input: unknown) => accountInputSchema.safeParse(input).error?.issues.map((issue) => issue.message)

describe('account schemas', () => {
  it('계좌 입력은 별칭·소유자·계좌번호·access key·secret key를 요구하고 공백을 정리한다', () => {
    const parsed = accountInputSchema.parse({ alias: ' 주식 ', owner: ' 홍길동 ', accountNumber: ' 12345678-01 ', accessKey: ' ak ', secretKey: ' sk ' })
    expect(parsed).toEqual(valid)
    expect(accountInputSchema.safeParse({ ...valid, alias: 'a'.repeat(31) }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, owner: 'a'.repeat(31) }).success).toBe(false)
  })

  it('검증 실패 메시지는 한글이다', () => {
    expect(messages({ ...valid, alias: '' })).toEqual(['별칭을 입력하세요'])
    expect(messages({ ...valid, alias: 'a'.repeat(31) })).toEqual(['별칭은 30자 이하로 입력하세요'])
    expect(messages({ ...valid, owner: ' ' })).toEqual(['소유자를 입력하세요'])
    expect(messages({ ...valid, accountNumber: '12-a' })).toEqual(['계좌번호는 숫자와 하이픈 4~30자로 입력하세요'])
    expect(messages({ ...valid, accessKey: '' })).toEqual(['Access Key를 입력하세요'])
    expect(messages({ ...valid, secretKey: '' })).toEqual(['Secret Key를 입력하세요'])
  })

  it('계좌번호는 숫자와 하이픈 4~30자만 허용한다', () => {
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '1234' }).success).toBe(true)
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '123' }).success).toBe(false)
  })

  it('수정은 별칭·소유자만 받고 다른 필드는 버린다', () => {
    expect(accountUpdateSchema.parse({ alias: ' 연금 ', owner: '김철수', accountNumber: '9999' })).toEqual({ alias: '연금', owner: '김철수' })
    expect(accountUpdateSchema.safeParse({ alias: '', owner: '김철수' }).success).toBe(false)
  })

  it('계좌 응답은 별칭·소유자·계좌번호만 평문으로 담고 키는 담지 않는다', () => {
    const account = { id: 'id-1', alias: '주식', owner: '홍길동', accountNumber: '12345678-01', createdAt: '2026-10-24T09:00:00.000Z' }
    const parsed = accountSchema.parse({ ...account, accessKey: 'ak', secretKey: 'sk' })
    expect(parsed).toEqual(account)
  })
})
