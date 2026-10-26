import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const OPERATIONS_TABS = ['portfolio', 'rebalancing'] as const
export type OperationsTab = (typeof OPERATIONS_TABS)[number]
export const DEFAULT_OPERATIONS_TAB: OperationsTab = 'portfolio'

export function normalizeOperationsTab(tab: unknown): OperationsTab {
  return tab === 'portfolio' || tab === 'rebalancing' ? tab : DEFAULT_OPERATIONS_TAB
}

type OperationsState = {
  tab: OperationsTab
  setTab: (tab: OperationsTab) => void
}

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set) => ({
      tab: DEFAULT_OPERATIONS_TAB,
      setTab: (tab) => set({ tab: normalizeOperationsTab(tab) }),
    }),
    {
      name: 'yogurt:operations',
      version: 1,
      merge: (persisted, current) => {
        const saved = persisted as Partial<OperationsState> | undefined
        return { ...current, tab: normalizeOperationsTab(saved?.tab) }
      },
      partialize: (s) => ({ tab: s.tab }),
    },
  ),
)
