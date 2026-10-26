import { AppVersion } from './AppVersion'
import { useRef } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../lib/useFocusTrap'
import { Button } from '../components/Button'
import { MENU_ITEMS, type ScreenId } from './menu'
import { layoutText } from '../glossary/layout'
import { typeScale } from '../styles/type-scale'
import { cn } from '../lib/cn'
import { SubNav } from './SubNav'
import { OVERVIEW_TAB_ITEMS } from '../overview/overview-tabs'
import { OPERATIONS_SUB_ITEMS } from '../operations/OperationsNav'
import { useUiStore, type OverviewTab } from '../state/ui-store'
import { useOperationsStore, type OperationsTab } from '../state/operations-store'

type MenuDrawerProps = {
  open: boolean; current: ScreenId; onNavigate: (id: ScreenId) => void; onClose: () => void
}

export function MenuDrawer({ open, current, onNavigate, onClose }: MenuDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open, onClose)
  const [overviewTab, setOverviewTab] = [useUiStore((s) => s.overviewTab), useUiStore((s) => s.setOverviewTab)]
  const [operationsTab, setOperationsTab] = [useOperationsStore((s) => s.tab), useOperationsStore((s) => s.setTab)]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
      <div ref={panelRef} id="mobile-menu" role="dialog" tabIndex={-1} aria-modal="true" aria-label={layoutText.menu}
        className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4">
          <div className={cn('flex items-center gap-2', typeScale.section)}>
            <img src="/favicon.png" alt="" aria-hidden="true" className="h-6 w-6 rounded" />
            <span>{layoutText.appName}</span>
          </div>
          <Button variant="ghost" size="icon" aria-label={layoutText.closeMenu} onClick={onClose}>
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        <nav aria-label={layoutText.mainMenu} className="flex flex-col gap-2 p-2">
          {MENU_ITEMS.map((item) => (
            <div key={item.id} className="flex flex-col gap-1">
              <Button variant={current === item.id ? 'default' : 'ghost'} className="w-full justify-start py-2.5 px-3"
                aria-current={current === item.id ? 'page' : undefined} onClick={() => { onNavigate(item.id); onClose() }}>
                <item.icon aria-hidden="true" className="h-4 w-4 text-current" />
                <span>{item.label}</span>
              </Button>
              {item.id === 'overview' && (
                <SubNav items={OVERVIEW_TAB_ITEMS} currentKey={overviewTab} isParentActive={current === 'overview'}
                  onSelect={(k) => { setOverviewTab(k as OverviewTab); onNavigate('overview'); onClose() }} />
              )}
              {item.id === 'operations' && (
                <SubNav items={OPERATIONS_SUB_ITEMS} currentKey={operationsTab} isParentActive={current === 'operations'}
                  onSelect={(k) => { setOperationsTab(k as OperationsTab); onNavigate('operations'); onClose() }} />
              )}
            </div>
          ))}
        </nav>
        <AppVersion />
      </div>
    </div>
  )
}
