export const typeScale = {
  pageTitle: 'text-2xl font-semibold tracking-tight text-stone-900',
  sectionTitle: 'text-lg font-semibold text-stone-900',
  cardTitle: 'text-base font-semibold text-stone-900',
  body: 'text-sm text-stone-700',
  label: 'text-xs font-medium text-stone-500',
  caption: 'text-xs text-stone-500',
  figure: 'text-2xl font-semibold tabular-nums text-stone-900',
  number: 'text-sm tabular-nums text-stone-900',
} as const

export const spacing = {
  page: 'p-4 md:p-8',
  section: 'flex flex-col gap-6',
  card: 'rounded-lg p-5 md:p-6',
  stack: 'flex flex-col gap-3',
  field: 'flex flex-col gap-1.5',
} as const
