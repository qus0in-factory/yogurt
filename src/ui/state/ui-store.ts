import { create } from 'zustand'
import type { ScreenId } from '../layout/menu'

type UiState = {
  screen: ScreenId
  drawerOpen: boolean
  navigate: (id: ScreenId) => void
  setDrawerOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  screen: 'accounts',
  drawerOpen: false,
  navigate: (id) => set({ screen: id, drawerOpen: false }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
}))
