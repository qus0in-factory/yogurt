import { create } from 'zustand'
import type { ScreenId } from '../layout/menu'

export const RECENT_VISITS_STORAGE_KEY = 'yogurt:recent-visits'
export const MAX_RECENT_VISITS = 3

export type RecentVisit = {
  screen: ScreenId
  tab?: string
  accountId?: string
  label: string
}

const isScreen = (value: unknown): value is ScreenId =>
  value === 'overview' || value === 'operations' || value === 'accounts'

const isVisit = (value: unknown): value is RecentVisit => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Partial<RecentVisit>
  return isScreen(item.screen) && typeof item.label === 'string'
    && (item.tab === undefined || typeof item.tab === 'string')
    && (item.accountId === undefined || typeof item.accountId === 'string')
}

const keyOf = (visit: RecentVisit) => `${visit.screen}|${visit.tab ?? ''}|${visit.accountId ?? ''}`
const storageVisit = (visit: RecentVisit): RecentVisit => {
  if (!visit.accountId) return visit
  if (visit.screen === 'accounts') return { ...visit, label: '' }
  return visit.label.includes(' · ') ? { ...visit, label: visit.label.split(' · ').slice(1).join(' · ') } : visit
}

export function pushRecentVisit(visits: RecentVisit[], visit: RecentVisit): RecentVisit[] {
  return [visit, ...visits.filter((item) => keyOf(item) !== keyOf(visit))].slice(0, MAX_RECENT_VISITS)
}

export function readRecentVisits(storage: Storage = localStorage): RecentVisit[] {
  try {
    const parsed = JSON.parse(storage.getItem(RECENT_VISITS_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter(isVisit).slice(0, MAX_RECENT_VISITS) : []
  } catch {
    return []
  }
}

export function writeRecentVisits(visits: RecentVisit[], storage: Storage = localStorage): void {
  try {
    storage.setItem(RECENT_VISITS_STORAGE_KEY, JSON.stringify(visits.slice(0, MAX_RECENT_VISITS)))
  } catch {
    return
  }
}

type RecentVisitsState = {
  visits: RecentVisit[]
  record: (visit: RecentVisit) => void
  clear: () => void
}

const initialVisits = typeof localStorage === 'undefined' ? [] : readRecentVisits()

export const useRecentVisitsStore = create<RecentVisitsState>((set) => ({
  visits: initialVisits,
  record: (visit) => set((state) => {
    const visits = pushRecentVisit(state.visits, visit)
    writeRecentVisits(visits.map(storageVisit))
    return { visits }
  }),
  clear: () => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(RECENT_VISITS_STORAGE_KEY)
    set({ visits: [] })
  },
}))
