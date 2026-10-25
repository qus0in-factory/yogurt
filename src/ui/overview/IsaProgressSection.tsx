import { useEffect, useState } from 'react'
import { computeIsaProgress, type IsaPlanInput } from '../../app/accounts/isa-progress'
import { PROGRESS_WINDOW_HALF_SPAN_DESKTOP, PROGRESS_WINDOW_HALF_SPAN_MOBILE } from '../../app/accounts/isa-progress-months'
import { seoulToday } from '../../app/accounts/isa-term'
import { Button } from '../components/Button'
import { isaText } from '../glossary/isa'
import { typeScale } from '../styles/type-scale'
import { IsaProgressChart } from './IsaProgressChart'
import { IsaProgressSummary } from './IsaProgressSummary'
import { IsaProgressTable } from './IsaProgressTable'
import { useIsaProgress } from './useIsaProgress'

interface Props {
  accountId: string
  plan?: IsaPlanInput | null
  today?: string
}

export function IsaProgressSection({ accountId, plan, today = seoulToday() }: Props) {
  const { isPending, isError, totalAssets, refetch } = useIsaProgress(accountId)
  const [wide, setWide] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(min-width: 768px)').matches : false))
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 768px)')
    const resize = () => setWide(media?.matches ?? false)
    media?.addEventListener('change', resize)
    return () => media?.removeEventListener('change', resize)
  }, [])
  if (!plan?.startDate) return null
  if (isPending) return <p role="status" className={typeScale.caption}>{isaText.progressLoading}</p>
  if (isError) {
    return (
      <div className="flex items-center gap-2">
        <p role="alert" className={typeScale.caption}>{isaText.progressUnavailable}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>{isaText.progressRetry}</Button>
      </div>
    )
  }
  const halfSpan = wide ? PROGRESS_WINDOW_HALF_SPAN_DESKTOP : PROGRESS_WINDOW_HALF_SPAN_MOBILE
  const prog = computeIsaProgress(today, plan, totalAssets, undefined, halfSpan)
  if (prog.state === 'no_targets') return <p className={typeScale.caption}>{isaText.progressTargetsMissing}</p>
  if (prog.state === 'expired') return <p className={typeScale.caption}>{isaText.progressAfterMaturity}</p>
  if (prog.state !== 'ready' || totalAssets === null) return <p role="alert" className={typeScale.caption}>{isaText.progressInvalid}</p>

  const l = plan.minTargetAmountWon ?? plan.minTarget ?? null
  const u = plan.maxTargetAmountWon ?? plan.maxTarget ?? null

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-primary-100 bg-white p-3">
      <div className="flex items-baseline justify-between">
        <h3 className={typeScale.label}>{isaText.progressTitle}</h3>
        {prog.position?.isEqualTarget && <span className={typeScale.caption}>{isaText.progressEqualTargets}</span>}
        {(l === null || u === null) && <span className={typeScale.caption}>{isaText.progressSingleTarget}</span>}
      </div>
      <IsaProgressSummary currentAssets={prog.effectiveAssets ?? totalAssets} position={prog.position} />
      <IsaProgressChart
        currentAssets={totalAssets}
        points={prog.pathPoints}
        hasMid={prog.hasMid}
        currentMonth={prog.currentMonth}
        expiryMonth={prog.expiry ? prog.expiry.slice(0, 7) : undefined}
      />
      <IsaProgressTable points={prog.pathPoints} hasMid={prog.hasMid} />
      <p className={`text-slate-400 ${typeScale.caption}`}>{isaText.progressNoHistory}</p>
    </div>
  )
}
