import { LayoutDashboard, SlidersHorizontal, Wallet, type LucideIcon } from 'lucide-react'
import { accountsText } from '../glossary/accounts'
import { operationsText } from '../glossary/operations'
import { overviewText } from '../glossary/overview'
import type { PageId } from '../../domain/navigation/page'

export type ScreenId = PageId

export type MenuItem = {
  id: ScreenId
  label: string
  icon: LucideIcon
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: overviewText.title, icon: LayoutDashboard },
  { id: 'operations', label: operationsText.title, icon: SlidersHorizontal },
  { id: 'accounts', label: accountsText.title, icon: Wallet },
]
