import { Scale } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { SectionHeading } from '../components/SectionHeading'
import { operationsText } from '../glossary/operations'
import { useOperationsStore } from '../state/operations-store'
import { OperationsTabs } from './OperationsTabs'
import { PortfolioSection } from './portfolio-list/PortfolioSection'

export function OperationsPage() {
  const tab = useOperationsStore((state) => state.tab)

  return (
    <section aria-label={operationsText.title}>
      <SectionHeading level={2}>{operationsText.title}</SectionHeading>
      <OperationsTabs />
      <div
        role="tabpanel"
        id={`operations-panel-${tab}`}
        aria-labelledby={`operations-tab-${tab}`}
        className="mt-4"
      >
        {tab === 'portfolio' ? (
          <PortfolioSection />
        ) : (
          <EmptyState
            icon={Scale}
            title={operationsText.rebalancingEmptyTitle}
            description={operationsText.rebalancingEmptyDescription}
            className="mt-3"
          />
        )}
      </div>
    </section>
  )
}
