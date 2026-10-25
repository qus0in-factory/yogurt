import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LAST_PAGE_STORAGE_KEY } from '../../../src/infra/navigation/last-page-storage'

describe('ui-store persist merge protection', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('기존 yogurt:ui에 임의 screen이 들어있어도 last-page 초기 복원값을 덮어쓰지 않는다', async () => {
    localStorage.setItem(
      LAST_PAGE_STORAGE_KEY,
      JSON.stringify({ version: 1, screen: 'overview' }),
    )
    localStorage.setItem(
      'yogurt:ui',
      JSON.stringify({
        state: { screen: 'accounts', overviewTab: 'isa' },
        version: 2,
      }),
    )
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    expect(useUiStore.getState().screen).toBe('overview')
    expect(useUiStore.getState().overviewTab).toBe('isa')
  })

  it('기존 yogurt:ui의 계좌 마이그레이션과 상품 탭이 정상 유지된다', async () => {
    localStorage.setItem(
      'yogurt:ui',
      JSON.stringify({
        state: { selectedIrpAccountId: 'irp-1' },
        version: 1,
      }),
    )
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    expect(useUiStore.getState().selectedIrpAccountId).toBe('irp-1')
    expect(useUiStore.getState().selectedProductAccountIds.irp).toBe('irp-1')
    expect(useUiStore.getState().screen).toBe('accounts')
  })

  it('rehydrate 후에도 현재 메모리의 screen이 유지된다', async () => {
    const { useUiStore } = await import('../../../src/ui/state/ui-store')
    useUiStore.setState({ screen: 'overview' })
    await useUiStore.persist.rehydrate()
    expect(useUiStore.getState().screen).toBe('overview')
  })
})
