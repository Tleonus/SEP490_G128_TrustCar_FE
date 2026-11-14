// Sức chứa mỗi khung lái thử: số khách (lượt đặt) tối đa trong cùng một khung giờ.
// Khung giờ lái thử là cố định, chỉ có sức chứa là Admin chỉnh được (nhân viên có hạn).
export const FIXED_SLOT_STARTS = ['08:00', '10:00', '13:00', '15:00']
export const MAX_GUESTS_MIN = 1
export const MAX_GUESTS_MAX = 100

/** @returns {string|null} Nội dung lỗi, hoặc null khi hợp lệ. */
export function validateMaxGuests(value) {
  if (!Number.isInteger(value) || value < MAX_GUESTS_MIN || value > MAX_GUESTS_MAX) {
    return `Số khách mỗi khung phải từ ${MAX_GUESTS_MIN} đến ${MAX_GUESTS_MAX}.`
  }
  return null
}

/** Số khách tối đa trong một ngày: mọi khung cố định đều đầy. */
export const maxGuestsPerDay = (maxGuestsPerSlot) =>
  Number.isInteger(maxGuestsPerSlot) && maxGuestsPerSlot > 0 ? FIXED_SLOT_STARTS.length * maxGuestsPerSlot : 0

/**
 * Chỉ gửi trường sức chứa đã đổi. BE ghép với phần còn lại của cấu hình hiện có (giờ mở/đóng,
 * nghỉ trưa, độ dài khung), nên các trường đó không bị ghi đè.
 */
export function buildCapacityChanges(form, saved) {
  return form.maxGuestsPerSlot !== saved.maxGuestsPerSlot ? { maxGuestsPerSlot: form.maxGuestsPerSlot } : {}
}
