import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { OverviewPage } from '../../../src/ui/overview/OverviewPage'
import { useUiStore } from '../../../src/ui/state/ui-store'
vi.mock('../../../src/ui/overview/ProductTab', () => ({
  ProductTab: ({ productCode }: { productCode: string }) => <p data-testid="product-panel">{productCode}</p>,
}))
afterEach(cleanup)
it('ISA를 기본으로 ISA·연금저축·IRP 순서의 아이콘 탭을 표시한다', () => {
  useUiStore.setState({ overviewTab: useUiStore.getInitialState().overviewTab })
  render(<OverviewPage />)
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map(tab => tab.textContent)).toEqual(['ISA', '연금저축', 'IRP'])
  const icons = ['trending-up', 'piggy-bank', 'armchair']
  tabs.forEach((tab, index) => {
    const icon = tab.querySelector('svg')
    expect(tab).toHaveClass('gap-2')
    expect(icon).toHaveClass('h-4', 'w-4', `lucide-${icons[index]}`)
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(tab.firstChild).toBe(icon)
  })
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByTestId('product-panel')).toHaveTextContent('01')
  fireEvent.click(tabs[1])
  expect(screen.getByTestId('product-panel')).toHaveTextContent('22')
  fireEvent.click(tabs[2])
  expect(screen.getByTestId('product-panel')).toHaveTextContent('29')
})
