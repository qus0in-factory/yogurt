import { AppVersion } from './AppVersion'
import { Button } from '../components/Button'
import { cn } from '../lib/cn'
import { MENU_ITEMS, type ScreenId } from './menu'
import { layoutText } from '../glossary/layout'
import { typeScale } from '../styles/type-scale'

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
  const current = props.current ?? props.active ?? props.activeId ?? props.selected ?? 'accounts'
  const onNavigate = props.onNavigate ?? props.onSelect ?? props.onChange ?? (() => {})
  return (
    <aside className={cn('hidden md:flex md:w-60 md:flex-col border-r border-stone-200 bg-white', props.className)}>
      <div className="flex items-center gap-2 p-4">
        <img src="/favicon.png" alt="" aria-hidden="true" className="h-6 w-6 shrink-0 rounded" />
        <span className={typeScale.section}>{layoutText.appName}</span>
      </div>
      <nav aria-label={layoutText.mainMenu} className="flex flex-col gap-2 p-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          return <Button
            key={item.id}
            variant={current === item.id ? 'default' : 'ghost'}
            className="w-full justify-start py-2.5 px-3"
            aria-current={current === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <Icon aria-hidden="true" className="h-4 w-4 text-current" />
            <span>{item.label}</span>
          </Button>
        })}
      </nav>
      <AppVersion />
    </aside>
  )
}

export default Sidebar
