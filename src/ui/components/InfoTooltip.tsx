import { Info, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { commonText } from '../glossary/common'
import { DESKTOP_MEDIA_QUERY } from '../lib/breakpoints'
import { clampTooltipPosition } from '../lib/tooltip-position'
import { cn } from '../lib/cn'
import { typeScale } from '../styles/type-scale'

export function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false))
  const [pointer, isClosing] = [useRef(false), useRef(false)]
  const [triggerRef, root] = [useRef<HTMLButtonElement>(null), useRef<HTMLSpanElement>(null)]
  const id = useId()
  const close = () => {
    isClosing.current = true; setOpen(false); triggerRef.current?.focus()
    setTimeout(() => { isClosing.current = false }, 50)
  }

  const desktopStyle = () => {
    if (typeof window === 'undefined' || !triggerRef.current || !root.current) return undefined
    const [t, r] = [triggerRef.current.getBoundingClientRect(), root.current.getBoundingClientRect()]
    return { left: `${clampTooltipPosition(t.left + t.width / 2, 224, window.innerWidth, 8) - r.left}px` }
  }

  useEffect(() => {
    const m = window.matchMedia?.(DESKTOP_MEDIA_QUERY)
    const resize = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    m?.addEventListener('change', resize)
    return () => m?.removeEventListener('change', resize)
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOnKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    const closeOnOutside = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', closeOnKey); document.addEventListener('mousedown', closeOnOutside)
    return () => { document.removeEventListener('keydown', closeOnKey); document.removeEventListener('mousedown', closeOnOutside) }
  }, [open])

  return (
    <span ref={root} className="relative inline-flex">
      <button ref={triggerRef} type="button" aria-label={label} aria-describedby={open ? id : undefined} aria-expanded={open}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center -m-3 p-3 text-stone-400 hover:text-stone-600 focus-visible:text-stone-600"
        onMouseEnter={() => { if (isDesktop) setOpen(true) }} onMouseLeave={() => { if (isDesktop) setOpen(false) }}
        onPointerDown={() => { pointer.current = true }} onFocus={() => { if (!pointer.current && !isClosing.current) setOpen(true) }}
        onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false) }} onClick={() => { pointer.current = false; setOpen((v) => !v) }}>
        <Info className="h-3.5 w-3.5 text-stone-400" aria-hidden />
      </button>
      {open && (!isDesktop ? (
        <>
          <div data-testid="tooltip-backdrop" className="fixed inset-0 z-40 bg-black/40" onClick={close} />
          <div role="tooltip" id={id} className="fixed inset-x-0 bottom-0 z-50 max-h-[50vh] overflow-y-auto rounded-t-xl bg-stone-900 p-4 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className={cn(typeScale.caption, 'text-white font-normal')}>{children}</div>
              <button type="button" aria-label={commonText.close} onClick={close} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center shrink-0 -m-2 p-2 text-stone-400 hover:text-white"><X className="h-4 w-4" aria-hidden /></button>
            </div>
          </div>
        </>
      ) : (
        <span role="tooltip" id={id} style={desktopStyle()} className={cn('absolute left-1/2 top-full z-20 mt-1 w-56 -translate-x-1/2 rounded-md bg-stone-900 px-2 py-1.5 leading-relaxed text-white shadow-lg', typeScale.caption, 'text-white font-normal')}>{children}</span>
      ))}
    </span>
  )
}
