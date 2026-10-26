import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IrpAccountBox } from '../../../src/ui/overview/IrpAccountBox'
import { typeScale } from '../../../src/ui/styles/type-scale'

describe('IrpAccountBox typography HEAD compatibility', () => {
  const account = { id: 'a1', alias: '내IRP', owner: '김영희', accountNumber: '987-654', products: ['29'], productPlans: {}, createdAt: '' }

  it('소유자와 계좌번호는 모바일 caption을 따르고 데스크톱에서는 HEAD(text-sm, 20px 행간, stone-600)로 복원된다', () => {
    render(<IrpAccountBox account={account} />)
    const owner = screen.getByText('김영희')
    expect(owner).toHaveClass(...typeScale.caption.split(' '))
    expect(owner).toHaveClass('md:text-sm', 'md:leading-5', 'md:text-stone-600')

    const acctNum = screen.getByText('987-654')
    expect(acctNum).toHaveClass(...typeScale.caption.split(' '))
    expect(acctNum).toHaveClass('md:text-sm', 'md:leading-5', 'md:text-stone-600')

    const alias = screen.getByText('내IRP')
    expect(alias).toHaveClass(...typeScale.title.split(' '))
    expect(alias).toHaveClass('md:text-lg')
  })
})
