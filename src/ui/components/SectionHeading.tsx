import type { ReactNode } from 'react'
import { typeScale } from '../styles/type-scale'

export function SectionHeading({ children, level = 3 }: { children: ReactNode; level?: 2 | 3 }) {
  const Tag = level === 2 ? 'h2' : 'h3'
  return <Tag className={typeScale.cardTitle}>{children}</Tag>
}
