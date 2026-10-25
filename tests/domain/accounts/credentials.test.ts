import { describe, expect, it } from 'vitest'
import { accountCredentialsSchema } from '../../../src/domain/accounts/credentials.ts'

const messages = (input: unknown) => accountCredentialsSchema.safeParse(input).error?.issues.map((i) => i.message)

describe('accountCredentialsSchema', () => {
  it('유효한 accessKey와 secretKey를 받고 공백을 정리한다', () => {
    const parsed = accountCredentialsSchema.parse({ accessKey: ' ak_123 ', secretKey: ' sk_456 ' })
    expect(parsed).toEqual({ accessKey: 'ak_123', secretKey: 'sk_456' })
  })

  it('빈 문자열이나 공백만 있으면 한국어 오류 메시지를 반환한다', () => {
    expect(messages({ accessKey: '', secretKey: 'sk' })).toEqual(['Access Key를 입력하세요'])
    expect(messages({ accessKey: '   ', secretKey: 'sk' })).toEqual(['Access Key를 입력하세요'])
    expect(messages({ accessKey: 'ak', secretKey: '' })).toEqual(['Secret Key를 입력하세요'])
    expect(messages({ accessKey: 'ak', secretKey: '   ' })).toEqual(['Secret Key를 입력하세요'])
  })

  it('필드가 누락되면 오류를 반환한다', () => {
    expect(accountCredentialsSchema.safeParse({}).success).toBe(false)
  })
})
