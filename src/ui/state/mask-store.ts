import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MASK_MODE_STORAGE_KEY = 'yogurt:mask-mode'

type MaskState = {
  masked: boolean
  toggleMask: () => void
  setMasked: (masked: boolean) => void
}

export const useMaskStore = create<MaskState>()(
  persist(
    (set) => ({
      masked: false,
      toggleMask: () => set((s) => ({ masked: !s.masked })),
      setMasked: (masked) => set({ masked }),
    }),
    {
      name: MASK_MODE_STORAGE_KEY,
    },
  ),
)
