import { overviewText as text } from '../glossary/overview'

type WeightBarProps = { weight: number }

export function WeightBar({ weight }: WeightBarProps) {
  const barWidth = Math.max(0, Math.min(100, weight))
  return (
    <span className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
      <span aria-hidden="true" className="h-1.5 min-w-0 w-full max-w-full flex-1 rounded bg-primary-100 md:w-20 md:flex-none md:shrink-0">
        <span data-testid="holding-weight" className="block h-full max-w-full rounded bg-primary-400" style={{ width: `${barWidth}%` }} />
      </span>
      <span className="min-w-0 text-right tabular-nums md:w-16 md:shrink-0">{text.weightPercent(weight)}</span>
    </span>
  )
}
