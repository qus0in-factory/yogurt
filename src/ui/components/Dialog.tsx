import { useRef, useId } from 'react'
import { useFocusTrap } from '../lib/useFocusTrap'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { cn } from '../lib/cn'
import { typeScale } from '../styles/type-scale'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, open, onClose)
  useBodyScrollLock(open)

  if (!open) return null

  return (
    <div
      data-testid="dialog-backdrop"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'flex max-h-[90dvh] w-full flex-col rounded-t-2xl rounded-b-none bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl outline-none md:max-h-[calc(100dvh-2rem)] md:max-w-md md:rounded-lg md:p-4',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={cn('shrink-0', typeScale.section)}>
          {title}
        </h2>
        <div data-testid="dialog-body" className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
