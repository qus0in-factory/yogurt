import { useCallback, useEffect, useRef, useState } from 'react'
import { lookupStockName } from '../../../app/stocks/stock-lookup'
import { STOCK_CODE_PATTERN } from '../../../domain/portfolio/item'

export type LookupError = 'not_found' | 'unavailable' | 'invalid_format' | null

export function useStockNameLookup(
  code: string,
  enabled = true,
  onSuccess?: (name: string) => void,
) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<LookupError>(null)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const execute = useCallback(async (targetCode: string) => {
    const trimmed = targetCode.trim().toUpperCase()
    if (!enabled || !trimmed) {
      setLoading(false)
      setError(null)
      return
    }
    if (!STOCK_CODE_PATTERN.test(trimmed)) {
      setLoading(false)
      setError('invalid_format')
      setResult(null)
      return
    }
    setLoading(true)
    setError(null)
    const res = await lookupStockName(trimmed)
    setLoading(false)
    if (res.status === 'success') {
      setResult(res.name)
      setError(null)
      onSuccessRef.current?.(res.name)
    } else {
      setResult(null)
      setError(res.status)
    }
  }, [enabled])

  const trigger = useCallback((targetCode?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    return execute(targetCode ?? code)
  }, [code, execute])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const trimmed = code.trim().toUpperCase()
    if (!enabled || !trimmed) {
      setLoading(false)
      setError(null)
      return
    }
    timerRef.current = setTimeout(() => {
      execute(trimmed)
    }, 500)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [code, enabled, execute])

  return { loading, result, error, trigger }
}
