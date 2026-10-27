import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_RECENT_VISITS, RECENT_VISITS_STORAGE_KEY, pushRecentVisit, readRecentVisits,
  useRecentVisitsStore, writeRecentVisits, type RecentVisit,
} from '../../../src/ui/state/recent-visits'

const visit = (screen: RecentVisit['screen'], label: string, extra: Partial<RecentVisit> = {}): RecentVisit => ({ screen, label, ...extra })
const account = visit('accounts', '계좌')
const isa = visit('overview', '현황 · ISA', { tab: 'isa' })
const operations = visit('operations', '운용 · 포트폴리오', { tab: 'portfolio' })
const pension = visit('overview', '주계좌 · 연금저축', { tab: 'pension', accountId: 'a1' })

beforeEach(() => {
  localStorage.clear()
  useRecentVisitsStore.getState().clear()
})

describe('recent visits stack', () => {
  it('중복은 맨 위로 올리고 최대 3개만 유지한다', () => {
    const list = [account, isa, operations, pension].reduce(pushRecentVisit, [] as RecentVisit[])
    expect(list.map((item) => item.label)).toEqual([pension.label, operations.label, isa.label])
    const again = pushRecentVisit(list, isa)
    expect(again.map((item) => item.label)).toEqual([isa.label, pension.label, operations.label])
    expect(again).toHaveLength(MAX_RECENT_VISITS)
  })

  it('로컬 저장에서 최대 3개를 복원하고 잘못된 값은 무시한다', () => {
    writeRecentVisits([pension, operations, isa, account])
    expect(readRecentVisits().map((item) => item.label)).toEqual([pension.label, operations.label, isa.label])
    localStorage.setItem(RECENT_VISITS_STORAGE_KEY, '{broken')
    expect(readRecentVisits()).toEqual([])
  })

  it('기록하면 최신순으로 저장하고 clear는 저장과 메모리를 비운다', () => {
    useRecentVisitsStore.getState().record(account)
    useRecentVisitsStore.getState().record(isa)
    expect(useRecentVisitsStore.getState().visits.map((item) => item.label)).toEqual([isa.label, account.label])
    expect(JSON.parse(localStorage.getItem(RECENT_VISITS_STORAGE_KEY) ?? '[]')).toHaveLength(2)
    useRecentVisitsStore.getState().clear()
    expect(useRecentVisitsStore.getState().visits).toEqual([])
    expect(localStorage.getItem(RECENT_VISITS_STORAGE_KEY)).toBeNull()
  })

  it('계좌 방문 저장값에는 별칭과 계좌번호를 남기지 않는다', () => {
    useRecentVisitsStore.getState().record({ screen: 'overview', tab: 'pension', accountId: 'a1', label: '주계좌 · 연금저축' })
    const raw = localStorage.getItem(RECENT_VISITS_STORAGE_KEY) ?? ''
    expect(raw).not.toContain('주계좌')
    expect(raw).not.toContain('12345678')
    expect(JSON.parse(raw)[0]).toEqual({ screen: 'overview', tab: 'pension', accountId: 'a1', label: '연금저축' })
  })
})
