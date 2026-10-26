import { useQuery } from '@tanstack/react-query'
import { getAccountAssets, getProductBalance } from '../../app/kis/account-assets-client'
import { classifyAssetRows, fundEvaluation, rpEvaluation } from '../../app/kis/asset-classes'
import { accountsText } from '../glossary/accounts'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { useAdaptiveWidth } from '../lib/useAdaptiveWidth'
import { IsaTermSection } from './IsaTermSection'
import { PensionAssets } from './PensionAssets'
import { PensionHoldings } from './PensionHoldings'
import { PensionLoan } from './PensionLoan'

export function PensionDetail({ accountId, productCode = '22', includeLoan = true }: { accountId: string; productCode?: string; includeLoan?: boolean }) {
  const assets = useQuery({ queryKey: ['account-assets', accountId, productCode], queryFn: () => getAccountAssets(accountId, productCode), retry: false })
  const balance = useQuery({ queryKey: ['product-balance', accountId, productCode], queryFn: ({ signal }) => getProductBalance(accountId, productCode, signal), retry: false })
  const width = useAdaptiveWidth()
  const wide = width === 'desktop'
  if (productCode !== '01') {
    if (assets.isPending || balance.isPending) return <p role="status">{accountsText.loading}</p>
    if (assets.isError || balance.isError) return <p role="alert">{text.pensionUnavailable}</p>
  }
  const fundAmount = assets.data ? fundEvaluation(assets.data.rows, productCode) : 0
  const assetItems = assets.data ? classifyAssetRows(assets.data.rows, productCode).items : []
  const isPension = productCode === '22'
  const showStock = !isPension || (assetItems.find((row) => row.label === 'stock')?.evaluationAmount ?? 0) !== 0
  const showCash = !isPension || (assetItems.find((row) => row.label === 'cash')?.evaluationAmount ?? 0) !== 0
  return (
    <section aria-label={text.detail} className={`${spacing.section} mb-8 rounded-lg border border-primary-200 bg-white p-4 max-[768px]:gap-4 max-[768px]:p-3 max-[375px]:gap-3`}>
      <h2 className={typeScale.section}>{text.detail}</h2>
      {productCode === '01' ? <IsaTermSection accountId={accountId} /> : null}
      {assets.isPending || balance.isPending ? (
        <p role="status">{accountsText.loading}</p>
      ) : assets.isError || balance.isError ? (
        <p role="alert">{text.isaUnavailable}</p>
      ) : (
        <>
          {includeLoan && fundAmount > 0 ? <PensionLoan loanAmount={assets.data.summary.loanAmount} collateralAmount={fundAmount} /> : null}
          {wide ? (
            <>
              <PensionAssets rows={assets.data.rows} productCode={productCode} showStock={showStock} showCash={showCash} />
              <PensionHoldings summary={balance.data.summary} holdings={balance.data.holdings} wide={wide} rp={rpEvaluation(assets.data.rows, productCode)} showHoldings={showStock} showCash={showCash} />
            </>
          ) : (
            <>
              <PensionHoldings summary={balance.data.summary} holdings={balance.data.holdings} wide={wide} rp={rpEvaluation(assets.data.rows, productCode)} showHoldings={showStock} showCash={showCash} />
              <PensionAssets rows={assets.data.rows} productCode={productCode} showStock={showStock} showCash={showCash} />
            </>
          )}
        </>
      )}
    </section>
  )
}
