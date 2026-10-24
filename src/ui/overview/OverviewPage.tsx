import { Button } from '../components/Button'
import { overviewText } from '../glossary/overview'
import { useUiStore } from '../state/ui-store'
import { IrpTab } from './IrpTab'

export function OverviewPage() {
  const tab = useUiStore((state) => state.overviewTab)
  const setTab = useUiStore((state) => state.setOverviewTab)
  return (
    <section>
      <h1 className="text-2xl font-semibold text-stone-900">{overviewText.title}</h1>
      <div role="tablist" aria-label={overviewText.tabsLabel} className="mt-4 flex gap-2">
        <Button
          role="tab"
          id="overview-tab-irp"
          aria-selected={tab === 'irp'}
          aria-controls="overview-panel-irp"
          variant={tab === 'irp' ? 'default' : 'ghost'}
          onClick={() => setTab('irp')}
        >
          {overviewText.irp}
        </Button>
      </div>
      <div role="tabpanel" id="overview-panel-irp" aria-labelledby="overview-tab-irp" className="mt-4">
        <IrpTab />
      </div>
    </section>
  )
}
