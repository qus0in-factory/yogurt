import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { MAX_WEIGHT_BPS } from '../../../domain/portfolio/weight'
import { portfolioListText } from '../../glossary/portfolio-list'
import { cn } from '../../lib/cn'
import { typeScale } from '../../styles/type-scale'
import { buildPortfolioPieModel } from './portfolio-list-model'

const RADIUS = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type PortfolioPieChartProps = {
  portfolio: Portfolio
}

export function PortfolioPieChart({ portfolio }: PortfolioPieChartProps) {
  const model = buildPortfolioPieModel(portfolio)

  if (!model.valid) {
    return <p className={typeScale.caption}>{portfolioListText.invalidTotalNotice}</p>
  }

  let offsetBps = 0

  return (
    <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
      <svg
        role="img"
        aria-label={portfolioListText.pieChartAriaLabel(portfolio.name, model.summaryText)}
        viewBox="0 0 120 120"
        className="h-[120px] w-[120px] shrink-0"
      >
        <g transform="rotate(-90 60 60)">
          {model.slices.map((slice) => {
            const length = (slice.weightBps / MAX_WEIGHT_BPS) * CIRCUMFERENCE
            const dashOffset = -((offsetBps / MAX_WEIGHT_BPS) * CIRCUMFERENCE)
            offsetBps += slice.weightBps
            return (
              <circle
                key={slice.key}
                data-testid="pie-slice"
                data-slice-label={slice.label}
                data-weight-bps={slice.weightBps}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                strokeWidth="60"
                strokeDasharray={`${length} ${CIRCUMFERENCE}`}
                strokeDashoffset={dashOffset}
                className={slice.strokeClass}
              />
            )
          })}
        </g>
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 w-full">
        {model.slices.map((slice) => (
          <li key={slice.key} className="flex min-w-0 w-full items-center gap-1.5">
            <span className="sr-only">{`${slice.label} ${slice.weightText}`}</span>
            <span aria-hidden="true" className={cn('h-2.5 w-2.5 shrink-0 rounded-full', slice.dotClass)} />
            <span className={cn(typeScale.body, 'min-w-0 truncate text-stone-700')}>{slice.label}</span>
            <span className={cn(typeScale.number, 'ml-auto shrink-0 tabular-nums text-right font-semibold text-primary-700')}>
              {slice.weightText}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
