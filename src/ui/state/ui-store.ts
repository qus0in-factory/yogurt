import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScreenId } from '../layout/menu'

type UiState = {
  screen: ScreenId
  drawerOpen: boolean
  selectedAccountId: string | null
  navigate: (id: ScreenId) => void
  setDrawerOpen: (open: boolean) => void
  selectAccount: (id: string | null) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      screen: 'accounts',
      drawerOpen: false,
      selectedAccountId: null,
      navigate: (id) => set({ screen: id, drawerOpen: false }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      selectAccount: (id) => set({ selectedAccountId: id }),
    }),
    {
      name: 'yogurt:ui',
      version: 1,
      partialize: (state) => ({ selectedAccountId: state.selectedAccountId }),
    },
  ),
)
