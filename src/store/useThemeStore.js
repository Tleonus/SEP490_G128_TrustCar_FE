import { create } from 'zustand'

const STORAGE_KEY = 'trustcar_theme'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* localStorage không khả dụng */
  }
  return 'light'
}

export const useThemeStore = create((set, get) => ({
  mode: getInitialTheme(),
  toggleMode: () => {
    const next = get().mode === 'light' ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* localStorage không khả dụng */
    }
    set({ mode: next })
  },
}))
