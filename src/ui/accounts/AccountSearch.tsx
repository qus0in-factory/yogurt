import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { accountsText } from '../glossary/accounts'

type Props = { query: string; total: number; matched: number; onChange: (query: string) => void }
export function AccountSearch({ query, total, matched, onChange }: Props) {
  const id = useId()
  return (
    <div className="mt-4">
      <label htmlFor={id} className="sr-only">{accountsText.search}</label>
      <div className="flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2">
        <Search aria-hidden="true" className="h-5 w-5 shrink-0" />
        <input id={id} type="search" value={query} placeholder={accountsText.search} onChange={event => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none [&::-webkit-search-cancel-button]:appearance-none" />
        {query && <button type="button" aria-label={accountsText.clearSearch} onClick={() => onChange('')} className="rounded-full p-1">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>}
      </div>
      {query.replace(/\s/g, '') && <p className="mt-2 text-sm text-stone-600">{accountsText.searchCount(matched, total)}</p>}
    </div>
  )
}
