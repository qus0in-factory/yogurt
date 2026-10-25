import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScreenId } from '../layout/menu'
import type { ProductKey } from '../../domain/accounts/products'

export type OverviewTab = ProductKey

type UiState = {
  screen: ScreenId
  drawerOpen: boolean
  selectedAccountId: string | null
  selectedProductAccountIds: Record<string, string | null>
  selectedIrpAccountId: string | null
  overviewTab: OverviewTab
  navigate: (id: ScreenId) => void
  setDrawerOpen: (open: boolean) => void
  selectAccount: (id: string | null) => void
  selectProductAccount: (key: string, id: string | null) => void
  selectIrpAccount: (id: string | null) => void
  setOverviewTab: (tab: OverviewTab) => void
}

const normalizeTab = (tab: unknown): OverviewTab => (tab === 'pension' ? 'pension' : 'irp')

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      screen: 'accounts',
      drawerOpen: false,
      selectedAccountId: null,
      selectedProductAccountIds: {},
      selectedIrpAccountId: null,
      overviewTab: 'irp',
      navigate: (id) => set({ screen: id, drawerOpen: false }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      selectAccount: (id) => set({ selectedAccountId: id }),
      selectProductAccount: (key, id) => set((s) => ({
        selectedProductAccountIds: { ...s.selectedProductAccountIds, [key]: id },
        ...(key === 'irp' ? { selectedIrpAccountId: id } : {}),
      })),
      selectIrpAccount: (id) => set((s) => ({
        selectedIrpAccountId: id,
        selectedProductAccountIds: { ...s.selectedProductAccountIds, irp: id },
      })),
      setOverviewTab: (tab) => set({ overviewTab: normalizeTab(tab) }),
    }),
    {
      name: 'yogurt:ui',
      version: 2,
      migrate: (persisted: any) => {
        if (!persisted) return persisted
        const ids = persisted.selectedProductAccountIds ?? {}
        if (persisted.selectedIrpAccountId && !ids.irp) ids.irp = persisted.selectedIrpAccountId
        return { ...persisted, selectedProductAccountIds: ids, selectedIrpAccountId: ids.irp ?? null }
      },
      partialize: (s) => ({
        selectedAccountId: s.selectedAccountId,
        selectedProductAccountIds: s.selectedProductAccountIds,
      }),
    },
  ),
)
