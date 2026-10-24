import { Button } from '../components/Button'
import { cn } from '../lib/cn'
import { MENU_ITEMS, type ScreenId } from './menu'

type SidebarProps = {
  current?: ScreenId
  active?: ScreenId
  activeId?: ScreenId
  selected?: ScreenId
  onNavigate?: (id: ScreenId) => void
  onSelect?: (id: ScreenId) => void
  onChange?: (id: ScreenId) => void
  className?: string
}

export function Sidebar(props: SidebarProps) {
  const current = props.current ?? props.active ?? props.activeId ?? props.selected ?? 'dashboard'
  const onNavigate = props.onNavigate ?? props.onSelect ?? props.onChange ?? (() => {})
  return (
    <aside className={cn('hidden md:flex md:w-60 md:flex-col border-r border-stone-200 bg-white', props.className)}>
      <div className="flex items-center gap-2 p-4 text-lg font-semibold">
        <img src="/favicon.png" alt="" aria-hidden="true" className="h-6 w-6 shrink-0 rounded" />
        <span>YOGURT</span>
      </div>
      <nav aria-label="주 메뉴" className="flex flex-col gap-1 p-2">
        {MENU_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant={current === item.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            aria-current={current === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
