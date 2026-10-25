import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { typeScale } from '../styles/type-scale'

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-primary-200 bg-primary-50/50 px-6 py-12 text-center', className)}>
      <div role="status" className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-primary-100 p-3">
          <Icon aria-hidden="true" className="h-8 w-8 text-primary-600" />
        </div>
        <p className={typeScale.cardTitle}>{title}</p>
        {description ? <p className={typeScale.caption}>{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
