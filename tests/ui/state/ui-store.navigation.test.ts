import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LAST_PAGE_STORAGE_KEY } from '../../../src/infra/navigation/last-page-storage'

describe('ui-store navigation & restore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('저장된 overview 페이지를 초기 screen으로 복원한다', async () => {
    localStorage.setItem(
      LAST_PAGE_STORAGE_KEY,
      JSON.stringify({ version: 1, screen: 'overview' }),
    )
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    expect(useUiStore.getState().screen).toBe('overview')
  })

  it('저장값이 없으면 기본 accounts로 초기화한다', async () => {
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    expect(useUiStore.getState().screen).toBe('accounts')
  })

  it('navigate 호출 시 screen을 변경하고 drawer를 닫으며 새 키에 저장한다', async () => {
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    useUiStore.setState({ drawerOpen: true })

    useUiStore.getState().navigate('overview')
    expect(useUiStore.getState().screen).toBe('overview')
    expect(useUiStore.getState().drawerOpen).toBe(false)
    expect(localStorage.getItem(LAST_PAGE_STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, screen: 'overview' }),
    )
  })

  it('drawer나 계좌 선택 변경 시에는 last-page 키를 건드리지 않는다', async () => {
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    expect(localStorage.getItem(LAST_PAGE_STORAGE_KEY)).toBeNull()

    useUiStore.getState().setDrawerOpen(true)
    useUiStore.getState().selectAccount('acc-1')
    expect(localStorage.getItem(LAST_PAGE_STORAGE_KEY)).toBeNull()
  })

  it('last-page 쓰기가 실패해도 메모리 상태 전환과 drawer 닫기는 동작한다', async () => {
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    useUiStore.setState({ drawerOpen: true })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
      if (key === LAST_PAGE_STORAGE_KEY) throw new Error('QuotaExceededError')
    })

    expect(() => useUiStore.getState().navigate('overview')).not.toThrow()
    expect(useUiStore.getState().screen).toBe('overview')
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })
})
