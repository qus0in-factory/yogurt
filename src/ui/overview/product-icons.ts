import { Armchair, PiggyBank, TrendingUp, type LucideIcon } from 'lucide-react'
import type { ProductKey } from '../../domain/accounts/products'

export const productIcons = {
  isa: TrendingUp,
  pension: PiggyBank,
  irp: Armchair,
} satisfies Record<ProductKey, LucideIcon>
