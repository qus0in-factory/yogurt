import { createElement, type ComponentType } from 'react'
import type { ProductKey } from '../../domain/accounts/products'
import { IrpDetail } from './IrpDetail'
import { PensionDetail } from './PensionDetail'

export const productSections = {
  irp: [{ type: 'summary', risk: true }, { type: 'holdings', riskToggle: true }, { type: 'cash' }],
  pension: [{ type: 'loan' }, { type: 'assets' }, { type: 'holdings' }, { type: 'cash' }],
  isa: [{ type: 'assets' }, { type: 'holdings' }, { type: 'cash' }],
} as const

function IsaDetail({ accountId }: { accountId: string }) {
  return createElement(PensionDetail, { accountId, productCode: '01', includeLoan: false })
}

export const productDetails = {
  irp: IrpDetail,
  pension: PensionDetail,
  isa: IsaDetail,
} satisfies Record<ProductKey, ComponentType<{ accountId: string }>>
