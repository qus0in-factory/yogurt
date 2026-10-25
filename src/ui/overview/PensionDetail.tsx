import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getAccountAssets, getProductBalance } from '../../app/kis/account-assets-client'
import { fundEvaluation, rpEvaluation } from '../../app/kis/asset-classes'
import { accountsText } from '../glossary/accounts'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { PensionLoan } from './PensionLoan'
import { PensionAssets } from './PensionAssets'
import { PensionHoldings } from './PensionHoldings'

export function PensionDetail({ accountId, productCode = '22', includeLoan = true }: { accountId: string; productCode?: string; includeLoan?: boolean }) {
  const assets = useQuery({
    queryKey: ['account-assets', accountId, productCode],
    queryFn: () => getAccountAssets(accountId, productCode),
    retry: false,
  })
  const balance = useQuery({
    queryKey: ['product-balance', accountId, productCode],
    queryFn: ({ signal }) => getProductBalance(accountId, productCode, signal),
    retry: false,
  })
  const [wide, setWide] = useState(() => window.matchMedia?.('(min-width: 768px)').matches ?? false)
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 768px)')
    const resize = (event: MediaQueryListEvent) => setWide(event.matches)
    media?.addEventListener('change', resize)
    return () => media?.removeEventListener('change', resize)
  }, [])
  if (assets.isPending || balance.isPending) return <p role="status">{accountsText.loading}</p>
  if (assets.isError || balance.isError) return <p role="alert">{productCode === '01' ? text.isaUnavailable : text.pensionUnavailable}</p>
  const fundAmount = fundEvaluation(assets.data.rows, productCode)
  return (
    <section aria-label={text.detail} className={`${spacing.section} mb-8 rounded-lg border border-primary-200 bg-white p-4`}>
      <h2 className={typeScale.sectionTitle}>{text.detail}</h2>
      {includeLoan && fundAmount > 0 ? <PensionLoan loanAmount={assets.data.summary.loanAmount} collateralAmount={fundAmount} /> : null}
      <PensionAssets rows={assets.data.rows} productCode={productCode} />
      <PensionHoldings summary={balance.data.summary} holdings={balance.data.holdings} wide={wide} rp={rpEvaluation(assets.data.rows, productCode)} />
    </section>
  )
}
