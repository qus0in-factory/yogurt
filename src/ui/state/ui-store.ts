import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScreenId } from '../layout/menu'
import { ACCOUNT_PRODUCTS, type ProductKey } from '../../domain/accounts/products'
import { readLastPage, writeLastPage } from '../../infra/navigation/last-page-storage'

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

const normalizeTab = (tab: unknown): OverviewTab => ACCOUNT_PRODUCTS.find(product => product.key === tab)?.key ?? ACCOUNT_PRODUCTS[0].key

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      screen: readLastPage(),
      drawerOpen: false,
      selectedAccountId: null,
      selectedProductAccountIds: {},
      selectedIrpAccountId: null,
      overviewTab: ACCOUNT_PRODUCTS[0].key,
      navigate: (id) => {
        writeLastPage(id)
        set({ screen: id, drawerOpen: false })
      },
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
      merge: (persisted, current) => {
        const saved = persisted as Partial<UiState> | undefined
        return { ...current, ...saved, screen: current.screen, overviewTab: normalizeTab(saved?.overviewTab) }
      },
      partialize: (s) => ({
        overviewTab: s.overviewTab,
        selectedAccountId: s.selectedAccountId,
        selectedProductAccountIds: s.selectedProductAccountIds,
      }),
    },
  ),
)
