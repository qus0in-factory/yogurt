import type { IsaPositionResult } from '../../app/accounts/isa-progress-position'
import { formatPercent } from '../../app/accounts/isa-progress-position'
import { isaText } from '../glossary/isa'
import { typeScale } from '../styles/type-scale'

interface Props {
  currentAssets: number
  position: IsaPositionResult | null
}

export function IsaProgressSummary({ currentAssets, position }: Props) {
  const manwon = Math.round(currentAssets / 10_000)
  const posText = position?.rangePosition !== null && position?.rangePosition !== undefined
    ? formatPercent(position.rangePosition)
    : null
  const statusLabel = position?.status === 'below'
    ? isaText.progressBelow
    : position?.status === 'above'
    ? isaText.progressAbove
    : position?.status === 'within'
    ? isaText.progressWithin
    : null

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className={typeScale.number}>{isaText.amount(manwon)}</span>
      {posText && statusLabel ? (
        <span className={typeScale.caption}>
          {isaText.progressRangePosition} {posText} ({statusLabel})
        </span>
      ) : null}
      {position?.minZero ? (
        <span className={typeScale.caption}>{isaText.minTarget} {isaText.progressZeroTarget}</span>
      ) : position?.minAchievement !== null && position?.minAchievement !== undefined ? (
        <span className={typeScale.caption}>{isaText.minTarget} {formatPercent(position.minAchievement)}</span>
      ) : null}
      {position?.maxZero ? (
        <span className={typeScale.caption}>{isaText.maxTarget} {isaText.progressZeroTarget}</span>
      ) : position?.maxAchievement !== null && position?.maxAchievement !== undefined ? (
        <span className={typeScale.caption}>{isaText.maxTarget} {formatPercent(position.maxAchievement)}</span>
      ) : null}
    </div>
  )
}
