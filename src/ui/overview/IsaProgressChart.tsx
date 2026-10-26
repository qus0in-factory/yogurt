import { calculateAxisRange, type PathPoint } from '../../app/accounts/isa-progress-path'
import { formatPercent } from '../../app/accounts/isa-progress-position'
import { isaText } from '../glossary/isa'

interface Props {
  currentAssets: number; points: PathPoint[]; hasMid: boolean
  currentMonth?: string; expiryMonth?: string
  lastClose?: { date: string; totalAssetsWon: number } | null
  isLoadingLastClose?: boolean; wide?: boolean
}

export function IsaProgressChart({
  currentAssets, points, hasMid, currentMonth, expiryMonth, lastClose, isLoadingLastClose, wide,
}: Props) {
  const isExp = Boolean(currentMonth && expiryMonth && currentMonth === expiryMonth)
  const isWide = wide ?? (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(min-width: 769px)').matches : false)
  const { minManwon, maxManwon, ticks } = calculateAxisRange(currentAssets, points)
  const [w, h, pl, pr, pt, pw, ph] = isWide ? [600, 220, 50, 60, 20, 490, 170] : [360, 220, 42, 30, 20, 288, 170]
  const count = points.length
  const getX = (i: number) => pl + (count <= 1 ? pw / 2 : (i / (count - 1)) * pw)
  const getY = (v: number | null) => (v === null ? 0 : pt + ph - ((Math.max(0, v) / 10_000 - minManwon) / (maxManwon - minManwon || 1)) * ph)
  const toLine = (k: 'min' | 'mid' | 'max') => points.filter((p) => p[k] !== null).map((p, i) => `${i ? 'L' : 'M'} ${getX(i)} ${getY(p[k])}`).join(' ')
  const toBand = () => {
    const v = points.filter((p) => p.min !== null && p.max !== null)
    return v.length < 2 ? '' : `${v.map((p, i) => `${i ? 'L' : 'M'} ${getX(i)} ${getY(p.max)}`).join(' ')} ${v.slice().reverse().map((_, i) => `L ${getX(v.length - 1 - i)} ${getY(v[v.length - 1 - i]?.min ?? null)}`).join(' ')} Z`
  }
  const toMan = (v: number | null) => (v !== null ? `${Math.round(v / 10_000)}${isaText.manUnit}` : '')
  const curIdx = Math.max(0, currentMonth ? points.findIndex((p) => p.month === currentMonth) : Math.floor(count / 2))
  const [curMin, curMid, curMax] = [points[curIdx]?.min ?? null, points[curIdx]?.mid ?? null, points[curIdx]?.max ?? null]
  const [isBelow, isAbove] = [curMin !== null && currentAssets < curMin, curMax !== null && currentAssets > curMax]
  const span = curMin !== null && curMax !== null ? curMax - curMin : 0
  const statusText = isBelow ? `${isaText.progressBelow} ${formatPercent(span > 0 ? (100 * (currentAssets - curMin!)) / span : 0)}`.trim() : isAbove ? `${isaText.progressAbove} ${formatPercent(span > 0 ? (100 * (currentAssets - curMin!)) / span : 0)}`.trim() : ''
  const plotValue = Math.max(0, isBelow ? (curMin ?? 0) : isAbove ? (curMax ?? 0) : currentAssets)
  const targetLabel = [curMin, curMid, curMax].map(toMan).filter(Boolean).join(' · ')
  const py = Math.min(pt + ph, Math.max(pt, getY(plotValue)))
  const [shift, waitY] = [Math.max(0, py + (statusText ? 28 : 16) - (h - 22)), Math.min(h - 22, Math.max(14, getY(plotValue)))]
  const [titleY, statusY, targetY] = [py - 10 - shift, py + 14 - shift, py + (statusText ? 28 : 16) - shift]
  const closedWon = isExp && lastClose ? Math.max(0, lastClose.totalAssetsWon) : null
  const closedY = closedWon !== null ? Math.min(pt + ph, Math.max(pt, getY(closedWon))) : null

  return (
    <div className="w-full min-h-[220px] overflow-hidden">
      <svg role="img" aria-label={isaText.progressTitle} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-h-[220px]">
        <defs><clipPath id="chart-plot-area"><rect x={pl} y={pt} width={pw} height={ph} /></clipPath></defs>
        {ticks.map((t) => (
          <g key={t}><line x1={pl} y1={getY(t * 10_000)} x2={w - pr} y2={getY(t * 10_000)} stroke="#e2e8f0" strokeDasharray="3 3" /><text x={pl - 6} y={getY(t * 10_000) + 4} textAnchor="end" className="text-xs fill-slate-400">{t.toLocaleString('ko-KR')}</text></g>
        ))}
        <g clipPath="url(#chart-plot-area)">
          {toBand() && <path data-testid="band-path" d={toBand()} fill="#bfdbfe" fillOpacity="0.35" />}
          {toLine('min') && <path d={toLine('min')} fill="none" stroke="#64748b" strokeWidth={isWide ? 1.5 : 2} strokeDasharray="4 4" />}
          {hasMid && toLine('mid') && <path data-testid="mid-path" d={toLine('mid')} fill="none" stroke="#3b82f6" strokeWidth={isWide ? 2 : 2.5} strokeDasharray={isWide ? '3 3' : '4 4'} />}
          {toLine('max') && <path d={toLine('max')} fill="none" stroke="#2563eb" strokeWidth={isWide ? 1.5 : 2} />}
          {!isExp && <circle data-testid="current-dot" cx={getX(curIdx)} cy={getY(plotValue)} r={isWide ? 5 : 6} fill="#1d4ed8" />}
          {isExp && closedY !== null && <circle data-testid="last-close-dot" cx={getX(curIdx)} cy={closedY} r={isWide ? 5 : 6} fill="#1d4ed8" />}
        </g>
        {points.map((p, i) => (
          <text data-testid="month-tick" key={p.month} x={getX(i)} y={h - 8} textAnchor="middle" className="text-xs fill-slate-500">{p.month.slice(2).replace('-', '.')}</text>
        ))}
        {isExp ? (
          isLoadingLastClose ? (
            <text data-testid="closing-loading" x={getX(curIdx)} y={waitY} textAnchor="middle" className="text-xs font-semibold fill-slate-500">{isaText.progressClosingLoading}</text>
          ) : closedWon !== null && lastClose ? (
            <text x={getX(curIdx)} y={Math.max(12, (closedY ?? waitY) - 8)} textAnchor="middle" className="text-xs font-semibold fill-primary-700">
              <tspan data-testid="last-close-value">{toMan(closedWon)}</tspan> <tspan data-testid="last-close-date" className="text-xs font-normal fill-slate-500">{lastClose.date}</tspan>
            </text>
          ) : (
            <text data-testid="closing-wait" x={getX(curIdx)} y={waitY} textAnchor="middle" className="text-xs font-semibold fill-amber-700">{isaText.progressWaitClosing}</text>
          )
        ) : (
          <>
            <text x={getX(curIdx)} y={titleY} textAnchor="middle" className="text-xs font-semibold fill-primary-700">{isaText.progressCurrent}</text>
            {statusText && <text x={getX(curIdx)} y={statusY} textAnchor="middle" className="text-xs font-semibold fill-blue-700">{statusText}</text>}
            {targetLabel && <text x={getX(curIdx)} y={targetY} textAnchor="middle" className="text-xs fill-slate-500">{targetLabel}</text>}
          </>
        )}
      </svg>
    </div>
  )
}
