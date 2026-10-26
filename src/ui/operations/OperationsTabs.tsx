import { PieChart, Scale } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { operationsText } from '../glossary/operations'
import { useOperationsStore, type OperationsTab } from '../state/operations-store'

export const OPERATIONS_TAB_ITEMS = [
  { key: 'portfolio' as const, label: operationsText.portfolioTab, icon: PieChart },
  { key: 'rebalancing' as const, label: operationsText.rebalancingTab, icon: Scale },
]

export function OperationsTabs() {
  const tab = useOperationsStore((state) => state.tab)
  const setTab = useOperationsStore((state) => state.setTab)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = OPERATIONS_TAB_ITEMS.map((item) => item.key)
    const index = keys.indexOf(tab)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault(); setTab(keys[(index + 1) % keys.length])
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault(); setTab(keys[(index - 1 + keys.length) % keys.length])
    } else if (e.key === 'Home') {
      e.preventDefault(); setTab(keys[0])
    } else if (e.key === 'End') {
      e.preventDefault(); setTab(keys[keys.length - 1])
    }
  }

  return (
    <div role="tablist" aria-label={operationsText.tabsLabel} onKeyDown={onKeyDown} className="mt-4 inline-flex rounded-lg bg-stone-100 p-1">
      {OPERATIONS_TAB_ITEMS.map((item) => {
        const Icon = item.icon
        const isSelected = item.key === tab
        return (
          <button
            key={item.key}
            role="tab"
            type="button"
            id={`operations-tab-${item.key}`}
            aria-selected={isSelected}
            aria-controls={`operations-panel-${item.key}`}
            tabIndex={isSelected ? 0 : -1}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              isSelected ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
            }`}
            onClick={() => setTab(item.key)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
