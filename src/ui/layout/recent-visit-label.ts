import type { Account } from '../../domain/accounts/account'
import { accountsText } from '../glossary/accounts'
import { layoutText } from '../glossary/layout'
import { operationsText } from '../glossary/operations'
import { overviewText } from '../glossary/overview'
import { OVERVIEW_TAB_ITEMS } from '../overview/overview-tabs'
import type { RecentVisit } from '../state/recent-visits'
import type { ScreenId } from './menu'

type AccountRef = Pick<Account, 'id' | 'alias'>

type Input = {
  screen: ScreenId
  overviewTab: string
  operationsTab: string
  selectedProductIds: Record<string, string | null>
  selectedAccountId: string | null
  accounts: AccountRef[]
}

const screenTitle = (screen: ScreenId) =>
  screen === 'overview' ? overviewText.title : screen === 'operations' ? operationsText.title : accountsText.title

const tabLabel = (screen: ScreenId, tab: string) => screen === 'overview'
  ? OVERVIEW_TAB_ITEMS.find((item) => item.key === tab)?.label
  : screen === 'operations'
    ? tab === 'portfolio' ? operationsText.portfolioTab : tab === 'rebalancing' ? operationsText.rebalancingTab : undefined
    : undefined

const visitLabel = (screen: ScreenId, tab: string | undefined, alias?: string) =>
  layoutText.recentVisitLabel(
    alias ?? (screen === 'accounts' ? layoutText.recentAccountsHome : screenTitle(screen)),
    tabLabel(screen, tab ?? ''),
  )

const accountOf = (accounts: AccountRef[], id?: string | null) =>
  id ? accounts.find((account) => account.id === id) : undefined

export function buildCurrentVisit(input: Input): RecentVisit | null {
  const { screen, accounts } = input
  if (screen === 'overview') {
    const accountId = input.selectedProductIds[input.overviewTab] ?? undefined
    const account = accountOf(accounts, accountId)
    if (accountId && !account) return null
    return {
      screen, tab: input.overviewTab, ...(accountId ? { accountId } : {}),
      label: visitLabel(screen, input.overviewTab, account?.alias),
    }
  }
  if (screen === 'operations') {
    return { screen, tab: input.operationsTab, label: visitLabel(screen, input.operationsTab) }
  }
  const account = accountOf(accounts, input.selectedAccountId)
  if (input.selectedAccountId && !account) return null
  return {
    screen: 'accounts', ...(account ? { accountId: account.id } : {}),
    label: visitLabel('accounts', undefined, account?.alias),
  }
}
