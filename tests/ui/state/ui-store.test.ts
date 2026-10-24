import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from '../../../src/ui/state/ui-store'

beforeEach(() => {
  localStorage.clear()
  useUiStore.setState({ screen: 'accounts', drawerOpen: false, selectedAccountId: null })
  useUiStore.persist.clearStorage()
})

describe('ui store', () => {
  it('기본 화면은 accounts이고 drawer는 닫혀 있다', () => {
    const state = useUiStore.getState()
    expect(state.screen).toBe('accounts')
    expect(state.drawerOpen).toBe(false)
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

  it('저장 시 localStorage에는 selectedAccountId만 있다', () => {
    useUiStore.getState().selectAccount('acc-1')
    const raw = localStorage.getItem('yogurt:ui')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.version).toBe(1)
    expect(parsed.state).toEqual({ selectedAccountId: 'acc-1' })
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

  it('rehydrate 시 selectedAccountId를 복원한다', () => {
    localStorage.setItem('yogurt:ui', JSON.stringify({ state: { selectedAccountId: 'acc-2' }, version: 1 }))
    useUiStore.persist.rehydrate()
    expect(useUiStore.getState().selectedAccountId).toBe('acc-2')
  })
})
