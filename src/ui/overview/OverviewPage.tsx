import { useAccounts } from '../accounts/useAccounts'
import { accountsText } from '../glossary/accounts'
import { overviewText } from '../glossary/overview'

export function OverviewPage() {
  const { data, isPending } = useAccounts()
  return (
    <section>
      <h1 className="text-2xl font-semibold text-stone-900">{overviewText.title}</h1>
      <p className="mt-4 text-stone-600">
        {isPending ? accountsText.loading : overviewText.count((data ?? []).length)}
      </p>
    </section>
  )
}
