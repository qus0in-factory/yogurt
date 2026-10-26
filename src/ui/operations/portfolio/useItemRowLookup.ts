import { useEffect, useRef } from 'react'
import { portfolioText } from '../../glossary/portfolio'
import type { EditorItem } from './portfolio-editor-types'
import { useStockNameLookup } from './useStockNameLookup'

export function useItemRowLookup(
  item: EditorItem,
  onChange: (field: keyof EditorItem, val: string) => void,
  onLoadingChange?: (loading: boolean) => void,
) {
  const onLoadingChangeRef = useRef(onLoadingChange)
  onLoadingChangeRef.current = onLoadingChange

  const enabled = item.kind !== 'cash' && !item.stockName
  const { loading, error, trigger } = useStockNameLookup(
    item.stockCode,
    enabled,
    (name) => onChange('stockName', name),
  )

  useEffect(() => {
    onLoadingChangeRef.current?.(loading)
    return () => onLoadingChangeRef.current?.(false)
  }, [loading])

  const message = loading
    ? portfolioText.stockLookingUp
    : error === 'invalid_format'
      ? portfolioText.stockInvalidFormat
      : error === 'not_found'
        ? portfolioText.stockNotFound
        : error === 'unavailable'
          ? portfolioText.stockLookupUnavailable
          : null

  return { message, trigger, isError: Boolean(error) }
}
