export type ScreenId = 'dashboard' | 'accounts' | 'transactions'

export type MenuItem = {
  id: ScreenId
  label: string
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'accounts', label: '계좌/자산' },
  { id: 'transactions', label: '거래' },
]
