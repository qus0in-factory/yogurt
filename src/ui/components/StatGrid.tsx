import type { ReactNode } from 'react'

export type StatItem = { label: ReactNode; value: ReactNode; note?: ReactNode }

export function StatGrid({ items, className = 'grid grid-cols-2 gap-4' }: {
  items: StatItem[]; className?: string
}) {
  return <dl className={className}>{items.map(({ label, value, note }, index) => (
    <div key={index}><dt>{label}</dt><dd>{value}</dd>{note}</div>
  ))}</dl>
}
