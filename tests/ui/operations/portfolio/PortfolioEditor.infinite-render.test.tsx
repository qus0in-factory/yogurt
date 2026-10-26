import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PortfolioEditorDialog } from '../../../../src/ui/operations/portfolio/PortfolioEditorDialog'

afterEach(cleanup)

describe('PortfolioEditorDialog render stability', () => {
  it('마운트 시 무한 렌더 루프 없이 안정적으로 렌더링된다', () => {
    const { unmount } = render(
      <PortfolioEditorDialog open onClose={vi.fn()} onSubmit={vi.fn()} />,
    )
    unmount()
  })

  it('종목 행이 있는 상태로 마운트되어도 무한 렌더 루프 없이 완료된다', () => {
    const initial = {
      name: '성장형',
      items: [{ kind: 'security' as const, stockCode: '005930', stockName: '삼성전자', targetWeightBps: 10000 }],
    }
    const { unmount } = render(
      <PortfolioEditorDialog open initialValue={initial} onClose={vi.fn()} onSubmit={vi.fn()} />,
    )
    unmount()
  })
})
