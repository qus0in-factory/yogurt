export type ProfitTone = { className: string; sign: '+' | '-' | '' }

export function profitTone(value: number): ProfitTone {
  if (value > 0) return { className: 'text-red-600', sign: '+' }
  if (value < 0) return { className: 'text-blue-600', sign: '-' }
  return { className: 'text-stone-500', sign: '' }
}
