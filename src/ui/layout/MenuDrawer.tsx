import { useRef } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../lib/useFocusTrap'
import { Button } from '../components/Button'
import { MENU_ITEMS, type ScreenId } from './menu'
import { layoutText } from '../glossary/layout'

type MenuDrawerProps = {
  open: boolean
  current: ScreenId
  onNavigate: (id: ScreenId) => void
  onClose: () => void
}

export function MenuDrawer({ open, current, onNavigate, onClose }: MenuDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open, onClose)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={layoutText.menu}
        className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <img src="/favicon.png" alt="" aria-hidden="true" className="h-6 w-6 rounded" />
            <span>{layoutText.appName}</span>
          </div>
          <Button variant="ghost" size="icon" aria-label={layoutText.closeMenu} onClick={onClose}>
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        <nav aria-label={layoutText.mainMenu} className="flex flex-col gap-2 p-2">
          {MENU_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant={current === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              aria-current={current === item.id ? 'page' : undefined}
              onClick={() => {
                onNavigate(item.id)
                onClose()
              }}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}
