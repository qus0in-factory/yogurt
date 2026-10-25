import { overviewText as text } from '../glossary/overview'

type WeightBarProps = { weight: number }

export function WeightBar({ weight }: WeightBarProps) {
  const barWidth = Math.max(0, Math.min(100, weight))
  return (
    <span className="flex w-full items-center justify-end gap-2">
      <span aria-hidden="true" className="h-1.5 w-20 shrink-0 rounded bg-primary-100">
        <span data-testid="holding-weight" className="block h-full rounded bg-primary-400" style={{ width: `${barWidth}%` }} />
      </span>
      <span className="w-16 shrink-0 text-right tabular-nums">{text.weightPercent(weight)}</span>
    </span>
  )
}
