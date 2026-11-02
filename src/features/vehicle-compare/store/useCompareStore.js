import { create } from 'zustand'
import { COMPARE_STORAGE_KEY } from '../constants/compareConstants'
import {
  sanitizeStored,
  toCompareItem,
  addItem,
  removeItem,
  pruneIds,
  hasItem,
} from '../utils/compareSelection'

// Mọi truy cập localStorage bọc try/catch: bị chặn hoặc hỏng thì chạy tiếp trong bộ nhớ phiên.

function readStored() {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY)
    return raw ? sanitizeStored(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

function writeStored(items) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage bị chặn hoặc đầy: bỏ qua, danh sách vẫn nằm trong store
  }
}

/**
 * Danh sách xe được chọn để so sánh (tối đa 3), lưu ở localStorage.
 * Danh sách chỉ phục vụ hiển thị thanh so sánh; giá và tình trạng bán luôn lấy từ API.
 *
 * toggle(car) trả về: 'added' | 'removed' | 'full' | 'invalid'.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F01
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F02
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F03
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F04
 */
export const useCompareStore = create((set, get) => {
  const commit = (items) => {
    writeStored(items)
    set({ items })
  }

  return {
    items: readStored(),

    toggle: (car) => {
      const item = toCompareItem(car)
      if (!item) return 'invalid'

      const { items } = get()
      if (hasItem(items, item.id)) {
        commit(removeItem(items, item.id))
        return 'removed'
      }

      const result = addItem(items, item)
      if (result.status !== 'added') return result.status === 'full' ? 'full' : 'invalid'
      commit(result.items)
      return 'added'
    },

    remove: (id) => commit(removeItem(get().items, id)),

    clear: () => commit([]),

    prune: (ids) => commit(pruneIds(get().items, ids)),
  }
})
