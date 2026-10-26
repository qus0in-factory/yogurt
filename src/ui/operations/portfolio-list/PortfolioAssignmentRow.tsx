import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PortfolioAssignmentProduct } from './PortfolioAssignmentProduct'
import { PortfolioAssignmentStatus } from './PortfolioAssignmentStatus'
import { PORTFOLIOS_QUERY_KEY, useClearPortfolioAssignment, useSetPortfolioAssignment } from '../../../app/portfolio/queries'
import { Sensitive } from '../../components/Sensitive'
import { portfolioListText } from '../../glossary/portfolio-list'
import { typeScale } from '../../styles/type-scale'
import type { ActiveProductTarget } from './portfolio-list-model'

type Props = { target: ActiveProductTarget; portfolioId: string; otherName?: string; isaStartDate?: string }

export function PortfolioAssignmentRow({ target, portfolioId, otherName, isaStartDate }: Props) {
  const setAssignment = useSetPortfolioAssignment()
  const clearAssignment = useClearPortfolioAssignment()
  const client = useQueryClient()
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)
  const checked = target.assignedPortfolioId === portfolioId
  const change = () => {
    if (pending) return
    setError(false)
    setPending(true)
    const callbacks = {
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: PORTFOLIOS_QUERY_KEY })
        setPending(false)
      },
      onError: () => { setPending(false); setError(true) },
    }
    const input = { accountId: target.accountId, productCode: target.productCode }
    if (checked) clearAssignment.mutate(input, callbacks)
    else setAssignment.mutate({ ...input, portfolioId }, callbacks)
  }
  return (
    <tr className={typeScale.caption}>
      <td className="w-9 min-w-9 max-w-9 whitespace-nowrap px-1 py-1 text-center">
        <label className="flex min-h-11 w-full items-center justify-center">
          <input type="checkbox" checked={checked} disabled={pending} onChange={change} aria-label={target.label} />
        </label>
      </td>
      <td className="px-2 py-1">
        <Sensitive>{target.accountNumber}</Sensitive>
        <span>{target.alias ? `(${target.alias})` : ''}</span>
        {error ? <p role="alert" className="text-rose-600">{portfolioListText.assignmentFailed}</p> : null}
      </td>
      <td className="whitespace-normal px-2 py-1">
        <PortfolioAssignmentProduct productCode={target.productCode} startDate={isaStartDate} />
      </td>
      <td className="px-2 py-1 text-center">
        <PortfolioAssignmentStatus checked={checked} assignedId={target.assignedPortfolioId} otherName={otherName} />
      </td>
    </tr>
  )
}
