import { expect, it } from 'vitest'
import { ACCOUNT_PRODUCTS, productCodeSchema } from '../../../src/domain/accounts/products'
it('상품 카탈로그는 ISA·연금저축·IRP 순서와 코드를 유지한다', () => {
  expect(ACCOUNT_PRODUCTS).toEqual([
    { code: '01', key: 'isa', label: 'ISA' },
    { code: '22', key: 'pension', label: '연금저축' },
    { code: '29', key: 'irp', label: 'IRP' },
  ])
})
it.each(['01', '22', '29'])('등록된 상품 %s를 허용한다', code => {
  expect(productCodeSchema.parse(code)).toBe(code)
})
it.each(['00', '99', '', '1'])('등록되지 않은 상품 %s를 거부한다', code => {
  expect(productCodeSchema.safeParse(code).success).toBe(false)
})
