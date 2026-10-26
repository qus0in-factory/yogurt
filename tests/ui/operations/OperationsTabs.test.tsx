import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OperationsTabs } from '../../../src/ui/operations/OperationsTabs'
import { useOperationsStore } from '../../../src/ui/state/operations-store'

afterEach(cleanup)

describe('OperationsTabs', () => {
  beforeEach(() => {
    useOperationsStore.setState({ tab: 'portfolio' })
  })

  it('키보드 ArrowRight/ArrowLeft 및 Home/End로 탭을 이동한다', () => {
    render(<OperationsTabs />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowRight' })
    expect(useOperationsStore.getState().tab).toBe('rebalancing')

    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })
    expect(useOperationsStore.getState().tab).toBe('portfolio')

    fireEvent.keyDown(tablist, { key: 'End' })
    expect(useOperationsStore.getState().tab).toBe('rebalancing')

    fireEvent.keyDown(tablist, { key: 'Home' })
    expect(useOperationsStore.getState().tab).toBe('portfolio')
  })
})
