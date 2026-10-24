import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './ui-store'

beforeEach(() => {
  useUiStore.setState({ screen: 'dashboard', drawerOpen: false })
})

describe('ui store', () => {
  it('기본 화면은 dashboard이고 drawer는 닫혀 있다', () => {
    const state = useUiStore.getState()
    expect(state.screen).toBe('dashboard')
    expect(state.drawerOpen).toBe(false)
  })

  it('navigate는 화면을 바꾸고 drawer를 닫는다', () => {
    useUiStore.getState().setDrawerOpen(true)
    useUiStore.getState().navigate('transactions')
    const state = useUiStore.getState()
    expect(state.screen).toBe('transactions')
    expect(state.drawerOpen).toBe(false)
  })

  it('setDrawerOpen은 drawer 상태를 바꾼다', () => {
    useUiStore.getState().setDrawerOpen(true)
    expect(useUiStore.getState().drawerOpen).toBe(true)
    useUiStore.getState().setDrawerOpen(false)
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })
})
