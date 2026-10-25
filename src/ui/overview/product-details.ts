import type { ProductKey } from '../../domain/accounts/products'
import { IrpDetail } from './IrpDetail'
import { PensionDetail } from './PensionDetail'

export const productDetails = {
  irp: IrpDetail,
  pension: PensionDetail,
} satisfies Record<ProductKey, typeof IrpDetail>
