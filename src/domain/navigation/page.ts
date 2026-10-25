export const ALLOWED_PAGES = ['accounts', 'overview'] as const

export type PageId = (typeof ALLOWED_PAGES)[number]

export const DEFAULT_PAGE: PageId = 'accounts'

export function isPageId(value: unknown): value is PageId {
  return typeof value === 'string' && (ALLOWED_PAGES as readonly string[]).includes(value)
}

export function normalizePage(value: unknown): PageId {
  return isPageId(value) ? value : DEFAULT_PAGE
}
