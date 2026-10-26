export const typeScale = {
  pageTitle: 'text-xl md:text-2xl font-semibold md:tracking-tight text-stone-900',
  section: 'text-lg font-semibold text-stone-900',
  title: 'text-base font-semibold text-stone-900',
  body: 'text-sm leading-[22px] md:leading-5 text-stone-700',
  number: 'text-base md:text-sm font-semibold md:font-normal tabular-nums text-stone-900',
  label: 'text-xs leading-[18px] md:leading-4 font-medium text-stone-500',
  caption: 'text-xs leading-[18px] md:leading-4 text-stone-500',
  figure: 'text-base md:text-2xl font-semibold tabular-nums text-stone-900',
} as const

export const spacing = {
  page: 'p-4 md:p-8',
  section: 'flex flex-col gap-6',
  card: 'rounded-lg p-5 md:p-6',
  stack: 'flex flex-col gap-3',
  field: 'flex flex-col gap-1.5',
} as const
