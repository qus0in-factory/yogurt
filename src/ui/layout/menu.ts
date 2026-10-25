import { LayoutDashboard, Wallet, type LucideIcon } from 'lucide-react'
import { accountsText } from '../glossary/accounts'
import { overviewText } from '../glossary/overview'

export type ScreenId = 'accounts' | 'overview'

export type MenuItem = {
  id: ScreenId
  label: string
  icon: LucideIcon
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: overviewText.title, icon: LayoutDashboard },
  { id: 'accounts', label: accountsText.title, icon: Wallet },
]
