import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_OPERATIONS_TAB,
  normalizeOperationsTab,
  useOperationsStore,
} from '../../../src/ui/state/operations-store'

describe('operations-store', () => {
  beforeEach(() => {
    localStorage.clear()
    useOperationsStore.setState({ tab: DEFAULT_OPERATIONS_TAB })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('기본 탭은 portfolio이다', () => {
    expect(useOperationsStore.getState().tab).toBe('portfolio')
  })

  it('탭을 rebalancing으로 변경할 수 있다', () => {
    useOperationsStore.getState().setTab('rebalancing')
    expect(useOperationsStore.getState().tab).toBe('rebalancing')
  })

  it('normalizeOperationsTab은 잘못된 값을 portfolio로 되돌린다', () => {
    expect(normalizeOperationsTab('unknown')).toBe('portfolio')
    expect(normalizeOperationsTab(null)).toBe('portfolio')
    expect(normalizeOperationsTab(undefined)).toBe('portfolio')
    expect(normalizeOperationsTab('portfolio')).toBe('portfolio')
    expect(normalizeOperationsTab('rebalancing')).toBe('rebalancing')
  })
})
