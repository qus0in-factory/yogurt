import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Wallet } from 'lucide-react'
import { afterEach, describe, expect, it } from 'vitest'
import { EmptyState } from '../../../src/ui/components/EmptyState'

afterEach(cleanup)

describe('EmptyState', () => {
  it('아이콘·제목·설명을 중앙 정렬 박스에 표시한다', () => {
    const { container } = render(<EmptyState icon={Wallet} title="등록된 계좌가 없습니다" description="첫 계좌를 추가하세요" />)
    expect(container.firstElementChild).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'text-center', 'rounded-lg', 'border-dashed', 'border-primary-200', 'bg-primary-50/50', 'px-6', 'py-12', 'gap-3')
    expect(screen.getByRole('status')).toHaveTextContent('등록된 계좌가 없습니다')
    expect(screen.getByText('첫 계좌를 추가하세요')).toHaveClass('text-xs', 'text-stone-500')
    const icon = screen.getByRole('status').querySelector('svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).toHaveClass('h-8', 'w-8', 'text-primary-600')
  })

  it('액션 슬롯과 작은 변형 클래스를 지원한다', () => {
    const { container } = render(<EmptyState icon={Wallet} title="보유 종목이 없습니다" action={<button type="button">계좌 추가</button>} className="py-8" />)
    expect(screen.getByRole('button', { name: '계좌 추가' })).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('py-8')
    expect(container.firstElementChild).not.toHaveClass('py-12')
  })
})
