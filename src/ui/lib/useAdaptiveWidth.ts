import { useEffect, useState } from 'react'
import { DESKTOP_BREAKPOINT_PX, DESKTOP_MEDIA_QUERY } from './breakpoints'

export type AdaptiveWidth = 'small' | 'mobile' | 'desktop'

export function classifyWidth(width: number): AdaptiveWidth {
  if (width <= 375) return 'small'
  if (width < DESKTOP_BREAKPOINT_PX) return 'mobile'
  return 'desktop'
}

export function useAdaptiveWidth(): AdaptiveWidth {
  const [width, setWidth] = useState<AdaptiveWidth>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'mobile'
    return classifyWidth(window.innerWidth)
  })
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const update = () => setWidth(classifyWidth(window.innerWidth))
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY)
    media.addEventListener?.('change', update)
    window.addEventListener('resize', update)
    return () => {
      media.removeEventListener?.('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return width
}
