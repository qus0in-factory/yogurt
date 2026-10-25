import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getAccountAssets, getProductBalance } from '../../app/kis/account-assets-client'
import { accountsText } from '../glossary/accounts'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { PensionLoan } from './PensionLoan'
import { PensionAssets } from './PensionAssets'
import { PensionHoldings } from './PensionHoldings'

const PRODUCT_CODE = '22'

export function PensionDetail({ accountId }: { accountId: string }) {
  const assets = useQuery({
    queryKey: ['account-assets', accountId, PRODUCT_CODE],
    queryFn: () => getAccountAssets(accountId, PRODUCT_CODE),
    retry: false,
  })
  const balance = useQuery({
    queryKey: ['product-balance', accountId, PRODUCT_CODE],
    queryFn: ({ signal }) => getProductBalance(accountId, PRODUCT_CODE, signal),
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
  if (assets.isError || balance.isError) return <p role="alert">{text.pensionUnavailable}</p>
  return (
    <section aria-label={text.detail} className={`${spacing.section} mb-8 rounded-lg border border-primary-200 bg-white p-4`}>
      <h2 className={typeScale.sectionTitle}>{text.detail}</h2>
      <PensionLoan summary={assets.data.summary} rows={assets.data.rows} />
      <PensionAssets rows={assets.data.rows} />
      <PensionHoldings summary={balance.data.summary} holdings={balance.data.holdings} wide={wide} />
    </section>
  )
}
