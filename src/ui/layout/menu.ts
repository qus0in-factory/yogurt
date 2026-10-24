import { accountsText } from '../glossary/accounts'
import { overviewText } from '../glossary/overview'

export type ScreenId = 'accounts' | 'overview'

export type MenuItem = {
  id: ScreenId
  label: string
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: overviewText.title },
  { id: 'accounts', label: accountsText.title },
]
