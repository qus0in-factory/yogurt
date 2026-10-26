import { AppVersion } from './AppVersion'
import { Button } from '../components/Button'
import { cn } from '../lib/cn'
import { MENU_ITEMS, type ScreenId } from './menu'
import { layoutText } from '../glossary/layout'
import { typeScale } from '../styles/type-scale'
import { SubNav } from './SubNav'
import { OVERVIEW_TAB_ITEMS } from '../overview/overview-tabs'
import { OPERATIONS_SUB_ITEMS } from '../operations/OperationsNav'
import { useUiStore, type OverviewTab } from '../state/ui-store'
import { useOperationsStore, type OperationsTab } from '../state/operations-store'

type SidebarProps = {
  current?: ScreenId; active?: ScreenId; activeId?: ScreenId; selected?: ScreenId
  onNavigate?: (id: ScreenId) => void; onSelect?: (id: ScreenId) => void; onChange?: (id: ScreenId) => void
  className?: string
}

export function Sidebar(props: SidebarProps) {
  const current = props.current ?? props.active ?? props.activeId ?? props.selected ?? 'accounts'
  const onNavigate = props.onNavigate ?? props.onSelect ?? props.onChange ?? (() => {})
  const [overviewTab, setOverviewTab] = [useUiStore((s) => s.overviewTab), useUiStore((s) => s.setOverviewTab)]
  const [operationsTab, setOperationsTab] = [useOperationsStore((s) => s.tab), useOperationsStore((s) => s.setTab)]

  return (
    <aside className={cn('hidden md:flex md:w-60 md:flex-col border-r border-stone-200 bg-white', props.className)}>
      <div className="flex items-center gap-2 p-4">
        <img src="/favicon.png" alt="" aria-hidden="true" className="h-6 w-6 shrink-0 rounded" />
        <span className={typeScale.section}>{layoutText.appName}</span>
      </div>
      <nav aria-label={layoutText.mainMenu} className="flex flex-col gap-2 p-2">
        {MENU_ITEMS.map((item) => (
          <div key={item.id} className="flex flex-col gap-1">
            <Button
              variant={current === item.id ? 'default' : 'ghost'}
              className="w-full justify-start py-2.5 px-3"
              aria-current={current === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <item.icon aria-hidden="true" className="h-4 w-4 text-current" />
              <span>{item.label}</span>
            </Button>
            {item.id === 'overview' && (
              <SubNav items={OVERVIEW_TAB_ITEMS} currentKey={overviewTab} isParentActive={current === 'overview'}
                onSelect={(k) => { setOverviewTab(k as OverviewTab); onNavigate('overview') }} />
            )}
            {item.id === 'operations' && (
              <SubNav items={OPERATIONS_SUB_ITEMS} currentKey={operationsTab} isParentActive={current === 'operations'}
                onSelect={(k) => { setOperationsTab(k as OperationsTab); onNavigate('operations') }} />
            )}
          </div>
        ))}
      </nav>
      <AppVersion />
    </aside>
  )
}

export default Sidebar
