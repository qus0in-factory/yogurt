import { SubNav } from '../layout/SubNav'
import { operationsText } from '../glossary/operations'
import { useOperationsStore, type OperationsTab } from '../state/operations-store'
import type { ScreenId } from '../layout/menu'

export const OPERATIONS_SUB_ITEMS: Array<{ key: OperationsTab; label: string }> = [
  { key: 'portfolio', label: operationsText.portfolioTab },
  { key: 'rebalancing', label: operationsText.rebalancingTab },
]

export function OperationsNav({
  current,
  onNavigate,
  onClose,
}: {
  current?: ScreenId
  onNavigate: (id: ScreenId) => void
  onClose?: () => void
}) {
  const tab = useOperationsStore((state) => state.tab)
  const setTab = useOperationsStore((state) => state.setTab)

  return (
    <SubNav
      items={OPERATIONS_SUB_ITEMS}
      currentKey={tab}
      isParentActive={current === 'operations'}
      onSelect={(key) => {
        setTab(key as OperationsTab)
        onNavigate('operations')
        onClose?.()
      }}
    />
  )
}
