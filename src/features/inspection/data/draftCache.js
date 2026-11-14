/**
 * KAN-55 – Bộ nhớ tạm biên bản đang soạn (trong phiên làm việc của trình duyệt).
 *
 * Yêu cầu: "Không làm mất dữ liệu khi người dùng quay lại trang chi tiết". Backend chỉ
 * lưu những gì đã bấm "Lưu nháp", nên phần đang gõ dở được giữ ở đây: điều hướng sang
 * màn danh sách rồi quay lại vẫn còn nguyên, kèm thông báo đã khôi phục.
 *
 * Đây là bộ nhớ in-memory của module (không phải localStorage): mất khi tải lại trang,
 * nhưng không bao giờ rò dữ liệu kiểm định nội bộ sang phiên/trình duyệt khác, và không
 * bao giờ ghi đè dữ liệu đã lưu trên server — chỉ dùng khi bản tạm mới hơn và còn bẩn.
 */

const cache = new Map()

/** @param {string} carId */
export function readDraftCache(carId) {
  if (!carId) return null
  return cache.get(String(carId)) || null
}

/**
 * @param {string} carId
 * @param {{ inspectionId: string|null, state: object, dirty: string[], savedAt: number }} entry
 */
export function writeDraftCache(carId, entry) {
  if (!carId || !entry) return
  cache.set(String(carId), { ...entry, cachedAt: Date.now() })
}

/** @param {string} carId */
export function clearDraftCache(carId) {
  if (!carId) return
  cache.delete(String(carId))
}

export function draftCacheSize() {
  return cache.size
}
