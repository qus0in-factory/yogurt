import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from '../../../src/ui/state/ui-store'

beforeEach(() => {
  localStorage.clear()
  useUiStore.setState({ screen: 'accounts', drawerOpen: false, selectedAccountId: null, selectedIrpAccountId: null, selectedProductAccountIds: {}, overviewTab: useUiStore.getInitialState().overviewTab })
  useUiStore.persist.clearStorage()
})

describe('ui store', () => {
  it('기본 화면은 accounts이고 overviewTab 기본은 isa, 알 수 없는 값은 isa다', () => {
    const state = useUiStore.getState()
    expect(state.screen).toBe('accounts')
    expect(state.drawerOpen).toBe(false)
    expect(state.overviewTab).toBe('isa')
    state.setOverviewTab('pension')
    expect(useUiStore.getState().overviewTab).toBe('pension')
    state.setOverviewTab('unknown' as any)
    expect(useUiStore.getState().overviewTab).toBe('isa')
  })

  it('selectAccount는 selectedAccountId를 바꾼다', () => {
    useUiStore.getState().selectAccount('acc-1')
    expect(useUiStore.getState().selectedAccountId).toBe('acc-1')
    useUiStore.getState().selectAccount(null)
    expect(useUiStore.getState().selectedAccountId).toBeNull()
  })

  it('상품별 계좌 선택과 선택 id를 localStorage에 저장한다', () => {
    useUiStore.getState().selectAccount('acc-1')
    useUiStore.getState().selectProductAccount('irp', 'irp-1')
    useUiStore.getState().selectProductAccount('pension', 'pen-1')
    const parsed = JSON.parse(localStorage.getItem('yogurt:ui') as string)
    expect(parsed.state.selectedProductAccountIds).toEqual({ irp: 'irp-1', pension: 'pen-1' })
  })

  it('기존 selectedIrpAccountId 저장 데이터를 selectedProductAccountIds.irp로 복원한다', () => {
    localStorage.setItem('yogurt:ui', JSON.stringify({ state: { selectedAccountId: 'acc-2', selectedIrpAccountId: 'irp-2' }, version: 1 }))
    useUiStore.persist.rehydrate()
    expect(useUiStore.getState().selectedAccountId).toBe('acc-2')
    expect(useUiStore.getState().selectedProductAccountIds.irp).toBe('irp-2')
  })
})
