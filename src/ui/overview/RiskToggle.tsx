import { ShieldAlert, ShieldCheck } from 'lucide-react'
import type { RiskClass } from '../../app/kis/risk-class-client'
import { Button } from '../components/Button'
import { overviewText as text } from '../glossary/overview'

export function RiskToggle({ riskClass, onToggle, disabled = false }: { riskClass: RiskClass; onToggle: () => void; disabled?: boolean }) {
  const risk = riskClass === 'risk'
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={risk}
      disabled={disabled}
      className={`gap-2 border ${risk
        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
      onClick={(event) => { event.stopPropagation(); onToggle() }}
    >
      {risk ? <ShieldAlert className="h-4 w-4" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
      {risk ? text.risk : text.safe}
    </Button>
  )
}
