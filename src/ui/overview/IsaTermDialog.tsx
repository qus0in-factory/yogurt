import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  fromProductPlan, isManwonInputValid, parseManwonInput, toProductPlanRequest, validateIsaPlanDraft,
} from '../../app/accounts/isa-plan'
import { safeIsaExpiry } from '../../app/accounts/isa-term'
import type { ProductPlan } from '../../domain/accounts/product-plan'
import { useProductPlan } from '../accounts/useProductPlan'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { isaText } from '../glossary/isa'
import { spacing, typeScale } from '../styles/type-scale'
import { IsaPlanAmountFields } from './IsaPlanAmountFields'

type Props = { accountId: string; plan?: ProductPlan; open: boolean; onClose: () => void }

export function IsaTermDialog({ accountId, plan, open, onClose }: Props) {
  const save = useProductPlan()
  const initial = fromProductPlan(plan)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [minTarget, setMinTarget] = useState(initial.minTargetAmountManwon === null ? '' : String(initial.minTargetAmountManwon))
  const [maxTarget, setMaxTarget] = useState(initial.maxTargetAmountManwon === null ? '' : String(initial.maxTargetAmountManwon))
  const [error, setError] = useState('')
  const expiry = startDate ? safeIsaExpiry(startDate) : null
  const preview = expiry ? isaText.date(expiry) : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!isManwonInputValid(minTarget)) return setError(isaText.minTargetInvalid)
    if (!isManwonInputValid(maxTarget)) return setError(isaText.maxTargetInvalid)
    const draft = {
      startDate,
      minTargetAmountManwon: parseManwonInput(minTarget),
      maxTargetAmountManwon: parseManwonInput(maxTarget),
    }
    const problem = validateIsaPlanDraft(draft)
    if (problem) return setError(isaText[problem])
    save.mutate({ id: accountId, code: '01', plan: toProductPlanRequest(draft) }, {
      onSuccess: () => {
        onClose()
        toast(isaText.saved)
      },
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title={plan ? isaText.editTitle : isaText.addTitle}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className={spacing.field}>
          <label className={typeScale.label} htmlFor="isa-start-date-input">{isaText.startDate}</label>
          <input
            id="isa-start-date-input"
            type="date"
            value={startDate}
            onChange={(event) => { setStartDate(event.target.value); setError('') }}
            className="h-10 rounded-md border border-primary-200 px-3 text-stone-900"
          />
          <p className={typeScale.caption}>{preview ? isaText.preview(preview) : null}</p>
        </div>
        <IsaPlanAmountFields
          minTarget={minTarget}
          maxTarget={maxTarget}
          error={error}
          onChange={(field, value) => {
            if (field === 'min') setMinTarget(value)
            else setMaxTarget(value)
            setError('')
          }}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>{isaText.cancel}</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? isaText.saving : isaText.save}</Button>
        </div>
      </form>
    </Dialog>
  )
}
