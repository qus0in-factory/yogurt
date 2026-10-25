import { expect, it } from 'vitest'
import { accountOrderSchema } from '../../../src/domain/accounts/account'
it('순서 요청은 비어 있지 않은 문자열 id 배열을 받는다', () => {
  expect(accountOrderSchema.parse({ ids: ['b', 'a'] })).toEqual({ ids: ['b', 'a'] })
})
it.each([{}, { ids: [] }, { ids: 'a' }, { ids: [1] }, null])('잘못된 순서 요청 %j를 거부한다', body => {
  expect(accountOrderSchema.safeParse(body).success).toBe(false)
})
