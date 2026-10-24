import { accountsText } from '../glossary/accounts'

export type ScreenId = 'accounts'

export type MenuItem = {
  id: ScreenId
  label: string
}

export const MENU_ITEMS: MenuItem[] = [{ id: 'accounts', label: accountsText.title }]
