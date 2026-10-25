import { DEFAULT_PAGE, normalizePage, type PageId } from '../../domain/navigation/page'

export const LAST_PAGE_STORAGE_KEY = 'yogurt:last-page'
export const LAST_PAGE_STORAGE_VERSION = 1

export function readLastPage(): PageId {
  try {
    const raw = localStorage.getItem(LAST_PAGE_STORAGE_KEY)
    if (!raw) return DEFAULT_PAGE
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return DEFAULT_PAGE
    }
    if (parsed.version !== LAST_PAGE_STORAGE_VERSION) {
      return DEFAULT_PAGE
    }
    if (parsed.screen !== 'overview' && parsed.screen !== 'accounts') {
      return DEFAULT_PAGE
    }
    return parsed.screen
  } catch {
    return DEFAULT_PAGE
  }
}

export function writeLastPage(page: PageId): void {
  try {
    const payload = {
      version: LAST_PAGE_STORAGE_VERSION,
      screen: normalizePage(page),
    }
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, JSON.stringify(payload))
  } catch {}
}
