import { describe, expect, it } from 'vitest'
import { accountInputSchema, accountSchema, accountUpdateSchema } from '../../../src/domain/accounts/account'
import { accountProductSchema } from '../../../src/domain/accounts/products'
import { productCodeSchema } from '../../../src/domain/accounts/products'

const valid = { alias: '주식', owner: '홍길동', accountNumber: '12345678', accessKey: 'ak', secretKey: 'sk' }
const messages = (input: unknown) => accountInputSchema.safeParse(input).error?.issues.map((issue) => issue.message)

describe('account schemas', () => {
  it('계좌 입력은 별칭·소유자·계좌번호·access key·secret key를 요구하고 공백을 정리한다', () => {
    const parsed = accountInputSchema.parse({ alias: ' 주식 ', owner: ' 홍길동 ', accountNumber: ' 12345678 ', accessKey: ' ak ', secretKey: ' sk ' })
    expect(parsed).toEqual(valid)
    expect(accountInputSchema.safeParse({ ...valid, alias: 'a'.repeat(16) }).success).toBe(true)
    expect(accountInputSchema.safeParse({ ...valid, alias: 'a'.repeat(17) }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, owner: 'a'.repeat(9) }).success).toBe(false)
  })

  it('검증 실패 메시지는 한글이다', () => {
    expect(messages({ ...valid, alias: '' })).toEqual(['별칭을 입력하세요'])
    expect(messages({ ...valid, alias: 'a'.repeat(17) })).toEqual(['별칭은 16자 이하로 입력하세요'])
    expect(messages({ ...valid, owner: ' ' })).toEqual(['소유자를 입력하세요'])
    expect(messages({ ...valid, accountNumber: '12-a' })).toEqual(['계좌번호는 숫자 8자리로 입력하세요'])
    expect(messages({ ...valid, accessKey: '' })).toEqual(['Access Key를 입력하세요'])
    expect(messages({ ...valid, secretKey: '' })).toEqual(['Secret Key를 입력하세요'])
  })

  it('계좌번호는 숫자 정확히 8자리만 허용한다', () => {
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '1234567' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '123456789' }).success).toBe(false)
    expect(accountInputSchema.safeParse({ ...valid, accountNumber: '1234-567' }).success).toBe(false)
  })

  it('별칭은 16자, 소유자는 8자까지 허용한다', () => {
    expect(accountInputSchema.safeParse({ ...valid, alias: '가'.repeat(16), owner: '나'.repeat(8) }).success).toBe(true)
    expect(accountInputSchema.safeParse({ ...valid, alias: '가'.repeat(17), owner: '나'.repeat(8) }).success).toBe(false)
    expect(accountUpdateSchema.safeParse({ alias: '가'.repeat(16), owner: '나' }).success).toBe(true)
    expect(accountUpdateSchema.safeParse({ alias: '가'.repeat(17), owner: '나' }).success).toBe(false)
    expect(accountUpdateSchema.safeParse({ alias: '가', owner: '나'.repeat(9) }).success).toBe(false)
  })

  it('수정은 별칭·소유자만 받고 다른 필드는 버린다', () => {
    expect(accountUpdateSchema.parse({ alias: ' 연금 ', owner: '김철수' })).toEqual({ alias: '연금', owner: '김철수' })
    expect(accountUpdateSchema.safeParse({ alias: '', owner: '김철수' }).success).toBe(false)
  })

  it('계좌 응답은 products 목록과 productPlans를 담고 키는 담지 않는다', () => {
    const account = {
      id: 'id-1',
      alias: '주식',
      owner: '홍길동',
      accountNumber: '12345678',
      products: ['01'],
      productPlans: { '01': { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null } },
      createdAt: '2026-10-24T09:00:00.000Z',
    }
    const parsed = accountSchema.parse({ ...account, accessKey: 'ak', secretKey: 'sk' })
    expect(parsed).toEqual(account)
  })

  it('상품코드 스키마는 등록된 상품만 허용한다', () => {
    expect(productCodeSchema.safeParse('29').success).toBe(true)
    expect(productCodeSchema.safeParse('22').success).toBe(true)
    expect(productCodeSchema.safeParse('01').success).toBe(true)
    expect(accountProductSchema.parse({ enabled: true })).toEqual({ enabled: true })
  })
})
