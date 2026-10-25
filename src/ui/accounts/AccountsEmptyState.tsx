import { SearchX, Wallet } from 'lucide-react'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { accountsText } from '../glossary/accounts'

type Props = { searching: boolean; onAdd: () => void }

export function AccountsEmptyState({ searching, onAdd }: Props) {
  if (searching) {
    return <EmptyState icon={SearchX} title={accountsText.noResults} description={accountsText.noResultsHint} />
  }
  return (
    <EmptyState
      icon={Wallet}
      title={accountsText.empty}
      description={accountsText.emptyHint}
      action={<Button aria-label={accountsText.emptyAction} onClick={onAdd}>{accountsText.add}</Button>}
    />
  )
}
