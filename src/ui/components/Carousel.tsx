import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { cn } from '../lib/cn'
import { commonText } from '../glossary/common'
import { typeScale } from '../styles/type-scale'
import { readSessionJson, writeSessionJson } from '../lib/session-draft'
import { DESKTOP_MEDIA_QUERY } from '../lib/breakpoints'

export type CarouselLabels = { list: string; previous: string; next: string; goTo: (page: number) => string; position: (index: number, total: number) => string }

type CarouselProps<T> = {
  items: T[]
  labels: CarouselLabels
  renderItem: (item: T) => React.ReactNode
  pageKey?: string
  onPageChange?: (page: number, pageSize: number) => void
  className?: string
}

export function Carousel<T>({ items, labels, renderItem, pageKey, onPageChange, className }: CarouselProps<T>) {
  const [media] = useState(() => window.matchMedia?.(DESKTOP_MEDIA_QUERY))
  const [pageSize, setPageSize] = useState(media?.matches ? 3 : 1)
  const [page, setPage] = useState(() => {
    const saved = pageKey ? readSessionJson<number>(pageKey) : null
    return typeof saved === 'number' && Number.isInteger(saved) && saved >= 0 ? saved : 0
  })
  const grid = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const pages = Math.ceil(items.length / pageSize)
  const current = Math.max(0, Math.min(page, pages - 1))
  const move = (next: number) => setPage(Math.max(0, Math.min(next, pages - 1)))
  useEffect(() => {
    const resize = (event: MediaQueryListEvent) => {
      const size = event.matches ? 3 : 1
      setPage(Math.floor(current * pageSize / size))
      setPageSize(size)
    }
    media?.addEventListener('change', resize)
    return () => media?.removeEventListener('change', resize)
  }, [media, current, pageSize])
  useEffect(() => {
    if (pageKey) writeSessionJson(pageKey, current)
    onPageChange?.(current, pageSize)
  }, [current, pageSize, pageKey, onPageChange])
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    grid.current?.animate?.([{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 180, easing: 'ease-out' })
  }, [current, pageSize])
  if (!items.length) return null
  return (
    <div className={cn('overflow-hidden px-2', className)}>
      <div tabIndex={0} aria-label={labels.list}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          move(current + (event.key === 'ArrowRight' ? 1 : -1))
        }}
        onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX ?? null }}
        onTouchEnd={(event) => {
          const end = event.changedTouches[0]?.clientX
          if (touchX.current !== null && end !== undefined && Math.abs(touchX.current - end) >= 50) move(current + (touchX.current > end ? 1 : -1))
          touchX.current = null
        }}>
        <div ref={grid} className="grid grid-cols-1 gap-4 min-[769px]:grid-cols-3">
          {items.slice(current * pageSize, (current + 1) * pageSize).map(renderItem)}
        </div>
      </div>
      {pages > 1 && <div className="mt-3 flex items-center justify-center gap-2">
        <Button size="icon" variant="outline" aria-label={labels.previous} disabled={current === 0} onClick={() => move(current - 1)}><ChevronLeft aria-hidden="true" className="h-5 w-5" /></Button>
        {Array.from({ length: pages }, (_, position) => <button key={position} type="button" aria-label={labels.goTo(position + 1)}
          aria-current={position === current ? 'true' : undefined} onClick={() => move(position)}
          className={`h-2 w-2 rounded-full ${position === current ? 'bg-primary-500' : 'bg-stone-300'}`} />)}
        <span role="status" aria-live="polite" aria-atomic="true" aria-label={commonText.pagePosition(current + 1, pages)}
          className={cn('inline-flex items-center justify-center min-w-16 whitespace-nowrap rounded-full bg-stone-100 px-2.5 py-0.5 text-center tabular-nums', typeScale.caption)}>{labels.position(current + 1, pages)}</span>
        <Button size="icon" variant="outline" aria-label={labels.next} disabled={current === pages - 1} onClick={() => move(current + 1)}><ChevronRight aria-hidden="true" className="h-5 w-5" /></Button>
      </div>}
    </div>
  )
}
