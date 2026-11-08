import { create } from 'zustand'
import {
  MAX_SAVED_CARS,
  SAVED_CARS_STORAGE_KEY,
  applyPrice,
  sanitizeSaved,
  savedIdOf,
  toSavedItem,
} from '../utils/savedCars'

// Mọi truy cập localStorage bọc try/catch: bị chặn hoặc hỏng thì chạy tiếp trong bộ nhớ phiên.
function readStored() {
  try {
    const raw = localStorage.getItem(SAVED_CARS_STORAGE_KEY)
    return raw ? sanitizeSaved(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

function writeStored(items) {
  try {
    localStorage.setItem(SAVED_CARS_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage bị chặn hoặc đầy: danh sách vẫn nằm trong store
  }
}

/**
 * Danh sách xe đã lưu (wishlist) và cấu hình cảnh báo giảm giá, lưu ở localStorage.
 * toggle(car) trả về: 'added' | 'removed' | 'full' | 'invalid'.
 */
export const useSavedCarsStore = create((set, get) => {
  const commit = (items) => {
    writeStored(items)
    set({ items })
  }
  const update = (id, updater) => commit(get().items.map((item) => (item.id === id ? updater(item) : item)))

  return {
    items: readStored(),

    isSaved: (car) => {
      const id = savedIdOf(car)
      return Boolean(id) && get().items.some((item) => item.id === id)
    },

    toggle: (car) => {
      const item = toSavedItem(car)
      if (!item) return 'invalid'
      const { items } = get()
      if (items.some((entry) => entry.id === item.id)) {
        commit(items.filter((entry) => entry.id !== item.id))
        return 'removed'
      }
      if (items.length >= MAX_SAVED_CARS) return 'full'
      commit([item, ...items])
      return 'added'
    },

    remove: (id) => commit(get().items.filter((item) => item.id !== id)),

    restore: (item) => {
      if (!item || get().items.some((entry) => entry.id === item.id)) return
      commit([item, ...get().items])
    },

    clear: () => commit([]),

    setAlert: (id, alert) => update(id, (item) => ({ ...item, alert: { ...item.alert, ...alert }, seenDropPrice: null })),

    syncPrice: (id, carOrPrice) => update(id, (item) => applyPrice(item, carOrPrice)),

    markUnavailable: (id) => update(id, (item) => ({ ...item, status: 'UNAVAILABLE', checkedAt: Date.now() })),

    markAlertsSeen: () =>
      commit(get().items.map((item) => ({ ...item, seenDropPrice: item.currentPrice }))),
  }
})
