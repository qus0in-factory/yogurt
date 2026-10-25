import { Info } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const pointer = useRef(false)
  const root = useRef<HTMLSpanElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const closeOnKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const closeOnOutside = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', closeOnKey)
    document.addEventListener('mousedown', closeOnOutside)
    return () => {
      document.removeEventListener('keydown', closeOnKey)
      document.removeEventListener('mousedown', closeOnOutside)
    }
  }, [open])
  return (
    <span ref={root} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        className="inline-flex items-center text-stone-400 hover:text-stone-600 focus-visible:text-stone-600"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onPointerDown={() => { pointer.current = true }}
        onFocus={() => { if (!pointer.current) setOpen(true) }}
        onBlur={() => setOpen(false)}
        onClick={() => { pointer.current = false; setOpen((value) => !value) }}
      >
        <Info className="h-3.5 w-3.5 text-stone-400" aria-hidden />
      </button>
      {open ? (
        <span role="tooltip" id={id} className="absolute left-1/2 top-full z-20 mt-1 w-56 -translate-x-1/2 rounded-md bg-stone-900 px-2 py-1.5 text-xs font-normal leading-relaxed text-white shadow-lg">
          {children}
        </span>
      ) : null}
    </span>
  )
}
