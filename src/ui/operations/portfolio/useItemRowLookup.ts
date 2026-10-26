import { useRef } from 'react'
import { portfolioText } from '../../glossary/portfolio'
import type { EditorItem } from './portfolio-editor-types'
import { useStockNameLookup } from './useStockNameLookup'

export function useItemRowLookup(
  item: EditorItem,
  onChange: (field: keyof EditorItem, val: string) => void,
) {
  const lastAutoFilledRef = useRef('')
  const { loading, error, trigger } = useStockNameLookup(
    item.stockCode,
    item.kind !== 'cash',
    (name) => {
      if (!item.stockName || item.stockName === lastAutoFilledRef.current) {
        lastAutoFilledRef.current = name
        onChange('stockName', name)
      }
    },
  )

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
