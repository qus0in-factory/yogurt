import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from '../../../src/ui/state/ui-store'

beforeEach(() => {
  localStorage.clear()
  useUiStore.setState({ screen: 'accounts', drawerOpen: false, selectedAccountId: null, selectedIrpAccountId: null })
  useUiStore.persist.clearStorage()
})

describe('ui store', () => {
  it('기본 화면은 accounts이고 drawer는 닫혀 있다', () => {
    const state = useUiStore.getState()
    expect(state.screen).toBe('accounts')
    expect(state.drawerOpen).toBe(false)
    expect(state.overviewTab).toBe('irp')
  })

  it('navigate는 화면을 바꾸고 drawer를 닫는다', () => {
    useUiStore.getState().setDrawerOpen(true)
    useUiStore.getState().navigate('accounts')
    const state = useUiStore.getState()
    expect(state.screen).toBe('accounts')
    expect(state.drawerOpen).toBe(false)
  })

  it('setDrawerOpen은 drawer 상태를 바꾼다', () => {
    useUiStore.getState().setDrawerOpen(true)
    expect(useUiStore.getState().drawerOpen).toBe(true)
    useUiStore.getState().setDrawerOpen(false)
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('selectAccount는 selectedAccountId를 바꾼다', () => {
    useUiStore.getState().selectAccount('acc-1')
    expect(useUiStore.getState().selectedAccountId).toBe('acc-1')
    useUiStore.getState().selectAccount(null)
    expect(useUiStore.getState().selectedAccountId).toBeNull()
  })

  it('계좌와 IRP 계좌를 선택하면 두 선택 id를 localStorage에 저장한다', () => {
    useUiStore.getState().selectAccount('acc-1')
    useUiStore.getState().selectIrpAccount('irp-1')
    const raw = localStorage.getItem('yogurt:ui')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.version).toBe(1)
    expect(parsed.state).toEqual({ selectedAccountId: 'acc-1', selectedIrpAccountId: 'irp-1' })
  })

  it('drawerOpen은 localStorage에 저장하지 않는다', () => {
    useUiStore.getState().setDrawerOpen(true)
    const raw = localStorage.getItem('yogurt:ui')
    if (raw) {
      const parsed = JSON.parse(raw)
      expect(parsed.state).not.toHaveProperty('drawerOpen')
      expect(parsed.state).not.toHaveProperty('screen')
    }
  })

  it('저장한 상태를 복원하면 계좌와 IRP 계좌의 선택 id가 복원된다', () => {
    localStorage.setItem('yogurt:ui', JSON.stringify({ state: { selectedAccountId: 'acc-2', selectedIrpAccountId: 'irp-2' }, version: 1 }))
    useUiStore.persist.rehydrate()
    expect(useUiStore.getState().selectedAccountId).toBe('acc-2')
    expect(useUiStore.getState().selectedIrpAccountId).toBe('irp-2')
  })
})
