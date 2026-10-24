import { useState } from 'react'
import { Button } from '../components/Button'
import type { ScreenId } from './menu'
import { MenuDrawer } from './MenuDrawer'

type MobileMenuProps = {
  open?: boolean
  onToggle?: () => void
  current?: ScreenId
  onNavigate?: (id: ScreenId) => void
}

export function MobileMenu(props: MobileMenuProps) {
  const [internal, setInternal] = useState(false)
  const open = props.open ?? internal
  const toggle = () => {
    if (props.open === undefined) setInternal((value) => !value)
    props.onToggle?.()
  }
  const close = () => {
    if (open) toggle()
  }

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        aria-label="메뉴"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={toggle}
      >
        <span aria-hidden="true" className="flex flex-col gap-1">
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
        </span>
      </Button>
      <MenuDrawer open={open} current={props.current ?? 'dashboard'} onNavigate={props.onNavigate ?? (() => {})} onClose={close} />
    </div>
  )
}

export default MobileMenu
