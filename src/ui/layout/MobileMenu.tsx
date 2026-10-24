import { useState } from 'react'
import { Menu } from 'lucide-react'
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
        <Menu aria-hidden="true" className="h-5 w-5" />
      </Button>
      <MenuDrawer open={open} current={props.current ?? 'accounts'} onNavigate={props.onNavigate ?? (() => {})} onClose={close} />
    </div>
  )
}

export default MobileMenu
