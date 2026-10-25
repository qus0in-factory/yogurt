import { ACCOUNT_PRODUCTS } from '../../domain/accounts/products'
import { overviewText } from '../glossary/overview'
import { useUiStore } from '../state/ui-store'
import { ProductTab } from './ProductTab'

export function OverviewPage() {
  const tab = useUiStore((state) => state.overviewTab)
  const setTab = useUiStore((state) => state.setOverviewTab)
  const activeProduct = ACCOUNT_PRODUCTS.find((p) => p.key === tab) ?? ACCOUNT_PRODUCTS[0]

  return (
    <section>
      <h1 className="text-2xl font-semibold text-stone-900">{overviewText.title}</h1>
      <div role="tablist" aria-label={overviewText.tabsLabel} className="mt-4 inline-flex rounded-lg bg-stone-100 p-1">
        {ACCOUNT_PRODUCTS.map((product) => {
          const isSelected = product.key === activeProduct.key
          return (
            <button
              key={product.key}
              role="tab"
              id={`overview-tab-${product.key}`}
              aria-selected={isSelected}
              aria-controls={`overview-panel-${product.key}`}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                isSelected ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
              onClick={() => setTab(product.key)}
            >
              {product.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`overview-panel-${activeProduct.key}`} aria-labelledby={`overview-tab-${activeProduct.key}`} className="mt-4">
        <ProductTab productCode={activeProduct.code} />
      </div>
    </section>
  )
}
