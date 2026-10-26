import type { IsaPositionResult } from '../../app/accounts/isa-progress-position'
import { formatPercent } from '../../app/accounts/isa-progress-position'
import { Sensitive } from '../components/Sensitive'
import { isaText } from '../glossary/isa'
import { typeScale } from '../styles/type-scale'

interface Props { currentAssets: number; position: IsaPositionResult | null }

const splitPct = (v: string | null) => (v && v.endsWith('%') ? { n: v.slice(0, -1), u: '%' } : null)

function Pct({ label, pct }: { label: string; pct: { n: string; u: string } }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={typeScale.caption}>{label}</span>
      <span className={typeScale.number}>{pct.n}<span className={`${typeScale.caption} font-normal`}>{pct.u}</span></span>
    </span>
  )
}

export function IsaProgressSummary({ currentAssets, position }: Props) {
  const manwon = Math.round(currentAssets / 10_000)
  const posPct = splitPct(position?.rangePosition !== null && position?.rangePosition !== undefined ? formatPercent(position.rangePosition) : null)
  const statusLabel = position?.status === 'below' ? isaText.progressBelow : position?.status === 'above' ? isaText.progressAbove : position?.status === 'within' ? isaText.progressWithin : null
  const minPct = splitPct(position?.minAchievement !== null && position?.minAchievement !== undefined ? formatPercent(position.minAchievement) : null)
  const maxPct = splitPct(position?.maxAchievement !== null && position?.maxAchievement !== undefined ? formatPercent(position.maxAchievement) : null)

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <Sensitive className={typeScale.number}>{manwon.toLocaleString('ko-KR')}</Sensitive><span className={`${typeScale.caption} font-normal`}>{isaText.amountUnit}</span>
      {posPct && statusLabel ? (
        <span className="inline-flex items-baseline gap-1">
          <span className={typeScale.caption}>{isaText.progressRangePosition}</span>
          <span className={typeScale.number}>{posPct.n}<span className={`${typeScale.caption} font-normal`}>{posPct.u}</span></span>
          <span className={typeScale.caption}>({statusLabel})</span>
        </span>
      ) : null}
      {position?.minZero ? <span className={typeScale.caption}>{isaText.minTarget} {isaText.progressZeroTarget}</span> : minPct ? <Pct label={isaText.minTarget} pct={minPct} /> : null}
      {position?.maxZero ? <span className={typeScale.caption}>{isaText.maxTarget} {isaText.progressZeroTarget}</span> : maxPct ? <Pct label={isaText.maxTarget} pct={maxPct} /> : null}
    </div>
  )
}
