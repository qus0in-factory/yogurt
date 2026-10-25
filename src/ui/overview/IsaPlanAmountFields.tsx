import { isaText } from '../glossary/isa'
import { spacing, typeScale } from '../styles/type-scale'

type Props = {
  minTarget: string
  maxTarget: string
  error?: string
  onChange: (field: 'min' | 'max', value: string) => void
}

const inputClass = 'h-10 w-full rounded-md border border-primary-200 px-3 text-stone-900'

export function IsaPlanAmountFields({ minTarget, maxTarget, error, onChange }: Props) {
  return (
    <div className={spacing.field}>
      <div className="grid grid-cols-2 gap-2">
        <div className={spacing.field}>
          <label className={typeScale.label} htmlFor="isa-min-target-input">{isaText.minTarget}</label>
          <div className="flex items-center gap-2">
            <input
              id="isa-min-target-input"
              type="number"
              min={0}
              step={1}
              value={minTarget}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'isa-plan-message' : undefined}
              onChange={(event) => onChange('min', event.target.value)}
              className={inputClass}
            />
            <span className={typeScale.caption}>{isaText.amountUnit}</span>
          </div>
        </div>
        <div className={spacing.field}>
          <label className={typeScale.label} htmlFor="isa-max-target-input">{isaText.maxTarget}</label>
          <div className="flex items-center gap-2">
            <input
              id="isa-max-target-input"
              type="number"
              min={0}
              step={1}
              value={maxTarget}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'isa-plan-message' : undefined}
              onChange={(event) => onChange('max', event.target.value)}
              className={inputClass}
            />
            <span className={typeScale.caption}>{isaText.amountUnit}</span>
          </div>
        </div>
      </div>
      <p id="isa-plan-message" className={typeScale.caption}>
        {error ? <span role="alert" className="text-red-600">{error}</span> : null}
      </p>
    </div>
  )
}
