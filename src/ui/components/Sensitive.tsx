import type { ElementType, ReactNode } from 'react'
import { useMaskStore } from '../state/mask-store'

type SensitiveProps<T extends ElementType = 'span'> = {
  children: ReactNode
  className?: string
  as?: T
}

export function Sensitive<T extends ElementType = 'span'>({ children, className, as }: SensitiveProps<T>) {
  const Component = as ?? 'span'
  const masked = useMaskStore((s) => s.masked)
  const base = `transition-[filter,opacity] duration-150${masked ? ' blur-[6px] opacity-60 select-none' : ''}`

  return (
    <Component
      data-sensitive="true"
      data-masked={masked ? 'true' : 'false'}
      className={className ? `${base} ${className}` : base}
    >
      {children}
    </Component>
  )
}
