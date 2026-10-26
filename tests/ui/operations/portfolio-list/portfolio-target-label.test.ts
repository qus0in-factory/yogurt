// @vitest-environment jsdom

import { expect, it } from 'vitest'
import { buildActiveProductTargets } from '../../../../src/ui/operations/portfolio-list/portfolio-list-model'
import { sampleAccounts } from './test-helpers'

it('계좌번호(별칭) 상품명 순서와 별칭이 없을 때의 표기를 지킨다', () => {
  const accounts = [sampleAccounts[0], { ...sampleAccounts[1], alias: '', products: ['22'] }]
  expect(buildActiveProductTargets(accounts, []).map(t => t.label)).toEqual([
    '12345678(주계좌) ISA', '12345678(주계좌) 연금저축', '87654321 연금저축',
  ])
})

it('IRP 혼합 계좌와 IRP 전용 계좌에서 29를 제외하고 활성 01·22만 만든다', () => {
  const targets = buildActiveProductTargets(sampleAccounts, [])
  expect(targets.map(t => t.productCode)).toEqual(['01', '22'])
  expect(targets.map(t => t.label)).toEqual(['12345678(주계좌) ISA', '12345678(주계좌) 연금저축'])
  expect(targets.some(t => t.accountId === 'acc-2')).toBe(false)
})
