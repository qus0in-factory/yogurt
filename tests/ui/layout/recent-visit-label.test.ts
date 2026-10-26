import { expect, it } from 'vitest'
import { buildCurrentVisit } from '../../../src/ui/layout/recent-visit-label'

const accounts = [{ id: 'a1', alias: '주계좌' }, { id: 'a2', alias: '퇴직계좌' }]
const base = {
  screen: 'overview' as const, overviewTab: 'pension', operationsTab: 'portfolio',
  selectedProductIds: { pension: 'a1' }, selectedAccountId: null, accounts,
}

it('현황 방문은 탭과 계좌 별칭을 함께 기록한다', () => {
  expect(buildCurrentVisit(base)).toEqual({ screen: 'overview', tab: 'pension', accountId: 'a1', label: '주계좌 · 연금저축' })
  expect(buildCurrentVisit({ ...base, selectedProductIds: {} })).toEqual({ screen: 'overview', tab: 'pension', label: '현황 · 연금저축' })
})

it('운용 방문은 하위 탭을, 계좌 방문은 선택 계좌 별칭을 기록한다', () => {
  expect(buildCurrentVisit({ ...base, screen: 'operations' })).toEqual({ screen: 'operations', tab: 'portfolio', label: '운용 · 포트폴리오' })
  expect(buildCurrentVisit({ ...base, screen: 'accounts', selectedAccountId: 'a2' })).toEqual({ screen: 'accounts', accountId: 'a2', label: '퇴직계좌' })
  expect(buildCurrentVisit({ ...base, screen: 'accounts', selectedAccountId: null })).toEqual({ screen: 'accounts', label: '계좌 홈' })
})

it('선택한 계좌를 아직 불러오지 못했으면 기록하지 않는다', () => {
  expect(buildCurrentVisit({ ...base, accounts: [] })).toBeNull()
  expect(buildCurrentVisit({ ...base, screen: 'accounts', selectedAccountId: 'a2', accounts: [] })).toBeNull()
})
