import { useState } from 'react'
import { Button } from '../components/Button'
import { cn } from '../lib/cn'
import { MENU_ITEMS, type ScreenId } from './menu'

type MobileMenuProps = {
  open?: boolean
  expanded?: boolean
  isOpen?: boolean
  onToggle?: () => void
  onOpenChange?: (open: boolean) => void
  current?: ScreenId
  active?: ScreenId
  onNavigate?: (id: ScreenId) => void
  onSelect?: (id: ScreenId) => void
  className?: string
}

export function MobileMenu(props: MobileMenuProps) {
  const controlled = props.open ?? props.expanded ?? props.isOpen
  const [internal, setInternal] = useState(false)
  const open = controlled ?? internal
  const toggle = () => {
    if (controlled === undefined) setInternal((value) => !value)
    props.onToggle?.()
    props.onOpenChange?.(!open)
  }
  const current = props.current ?? props.active ?? 'dashboard'
  const onNavigate = props.onNavigate ?? props.onSelect ?? (() => {})
  return (
    <div className={cn('md:hidden', props.className)}>
      <Button
        variant="outline"
        size="icon"
        aria-label="메뉴"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={toggle}
      >
        메뉴
      </Button>
      {open ? (
        <nav id="mobile-menu" aria-label="주 메뉴" className="flex flex-col gap-1 bg-white p-2">
          {MENU_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant={current === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              aria-current={current === item.id ? 'page' : undefined}
              onClick={() => {
                onNavigate(item.id)
                if (controlled === undefined) setInternal(false)
              }}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

export default MobileMenu
