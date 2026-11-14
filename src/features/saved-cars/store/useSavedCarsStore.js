import { create } from 'zustand'
import {
  MAX_SAVED_CARS,
  SAVED_CARS_STORAGE_KEY,
  applyPrice,
  sanitizeSaved,
  savedIdOf,
  toSavedItem,
} from '../utils/savedCars'
import {
  getWishlist,
  removeCarFromWishlist,
  saveCarToWishlist,
  setWishlistAlert,
  syncGuestWishlist,
} from '../api/wishlistApi'

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
    if (items.length) localStorage.setItem(SAVED_CARS_STORAGE_KEY, JSON.stringify(items))
    else localStorage.removeItem(SAVED_CARS_STORAGE_KEY)
  } catch {
    // localStorage bá»‹ cháº·n hoáº·c Ä‘áº§y: danh sÃ¡ch váº«n náº±m trong store
  }
}

const isMongoId = (id) => /^[0-9a-f]{24}$/i.test(String(id || ''))

function apiItemToSaved(item) {
  const car = item?.car
  if (!item || !car) return null
  const image = car.primaryImageUrl || null
  const price = item.currentPrice ?? car.price ?? null
  const savedPrice = item.priceAtSave ?? price
  const savedAt = item.savedAt ? new Date(item.savedAt).getTime() : Date.now()
  const base = toSavedItem({ ...car, _id: item.carId, images: image ? [{ url: image }] : [] }, savedAt)
  if (!base) return null

  return {
    ...base,
    id: String(item.carId).toLowerCase(),
    rawId: item.carId,
    routeKey: car.vehicleCode || item.carId,
    vehicleCode: car.vehicleCode || null,
    title: [car.make, car.model, car.variant].filter(Boolean).join(' ') || 'Xe',
    image,
    savedPrice,
    currentPrice: price,
    history: price == null ? [] : [{ price, at: savedAt }],
    savedAt,
    checkedAt: Date.now(),
    alert: { enabled: Boolean(item.priceAlertEnabled), targetPrice: null },
    serverSaved: true,
  }
}

export const useSavedCarsStore = create((set, get) => {
  const commit = (items, persistGuest = !get().isAuthenticatedMode) => {
    if (persistGuest) writeStored(items)
    set({ items })
  }

  const update = (id, updater) => commit(
    get().items.map((item) => (item.id === id ? updater(item) : item)),
  )

  return {
    items: readStored(),
    isAuthenticatedMode: false,
    loading: false,
    initialized: false,
    error: null,

    isSaved: (car) => {
      const id = savedIdOf(car)
      return Boolean(id) && get().items.some((item) => item.id === id)
    },

    activateAuthenticated: async () => {
      if (get().isAuthenticatedMode && get().initialized) return get().items
      const guestItems = get().items
      const guestIds = guestItems.map((item) => item.id).filter(isMongoId)
      set({ isAuthenticatedMode: true, items: [], loading: true, error: null })

      try {
        if (guestIds.length) await syncGuestWishlist(guestIds)
        const { items } = await getWishlist({ page: 1, limit: 100 })
        const serverItems = items.map(apiItemToSaved).filter(Boolean)
        writeStored([])
        set({ items: serverItems, loading: false, initialized: true })
        return serverItems
      } catch (error) {
      // Khi đồng bộ lỗi, không hiển thị danh sách tạm cho tài khoản.
        set({ items: [], loading: false, initialized: true, error })
        return null
      }
    },

    deactivateAuthenticated: () => {
      set({ items: readStored(), isAuthenticatedMode: false, initialized: false, loading: false, error: null })
    },

    toggle: async (car) => {
      const item = toSavedItem(car)
      if (!item) return 'invalid'
      const { items, isAuthenticatedMode } = get()
      const existing = items.some((entry) => entry.id === item.id)

      if (existing) {
        if (isAuthenticatedMode) {
          try {
            await removeCarFromWishlist(item.id)
          } catch {
            return 'error'
          }
        }
        commit(items.filter((entry) => entry.id !== item.id), !isAuthenticatedMode)
        return 'removed'
      }

      if (items.length >= MAX_SAVED_CARS) return 'full'
      if (isAuthenticatedMode) {
        try {
          await saveCarToWishlist(item.id)
        } catch {
          return 'error'
        }
      }
      commit([item, ...items], !isAuthenticatedMode)
      return 'added'
    },

    remove: async (id) => {
      if (get().isAuthenticatedMode) {
        try {
          await removeCarFromWishlist(id)
        } catch {
          return false
        }
      }
      commit(get().items.filter((item) => item.id !== id))
      return true
    },
    restore: async (item) => {
      if (!item || get().items.some((entry) => entry.id === item.id)) return true
      if (get().isAuthenticatedMode) {
        try {
          await saveCarToWishlist(item.id)
        } catch {
          return false
        }
      }
      commit([item, ...get().items])
      return true
    },
    clear: async () => {
      if (get().isAuthenticatedMode) {
        const ids = get().items.map((item) => item.id)
        const results = await Promise.allSettled(ids.map((id) => removeCarFromWishlist(id)))
        if (results.some((result) => result.status === 'rejected')) return false
      }
      commit([])
      return true
    },
    setAlert: async (id, alert) => {
      if (get().isAuthenticatedMode) {
        try {
          await setWishlistAlert(id, Boolean(alert.enabled))
        } catch {
          return false
        }
      }
      update(id, (item) => ({ ...item, alert: { ...item.alert, ...alert }, seenDropPrice: null }))
      return true
    },
    syncPrice: (id, carOrPrice) => update(id, (item) => applyPrice(item, carOrPrice)),
    markUnavailable: (id) => update(id, (item) => ({ ...item, status: 'UNAVAILABLE', checkedAt: Date.now() })),
    markAlertsSeen: () => commit(get().items.map((item) => ({ ...item, seenDropPrice: item.currentPrice }))),
  }
})

