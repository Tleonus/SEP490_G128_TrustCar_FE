// Hàm thuần xử lý dữ liệu khung giờ từ GET /customer/appointments/slots.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F03 và hợp đồng API-TEST-DRIVE-BOOKING (BE Spec mục 5)

import { SLOT_REASON_LABEL } from '../constants/testDriveConstants'
import { formatVnTime, shortDate, weekdayLabel } from './vnTime'

/**
 * Chuẩn hóa `data.days` thành danh sách ngày dùng cho thanh chọn ngày.
 * Mỗi ngày: { date, weekday, short, slots, availableCount }.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F03
 * @param {Array<{ date: string, slots: object[] }>} days
 */
export function groupDays(days) {
  if (!Array.isArray(days)) return []
  return days.map((day) => {
    const slots = Array.isArray(day.slots) ? day.slots : []
    return {
      date: day.date,
      weekday: weekdayLabel(day.date),
      short: shortDate(day.date),
      slots,
      availableCount: slots.filter((slot) => slot.available === true).length,
    }
  })
}

/** Ngày gần nhất còn ít nhất một khung trống; không có thì ngày đầu tiên; rỗng thì null. */
export function firstAvailableDay(days) {
  const list = Array.isArray(days) ? days : []
  const found = list.find((day) => (day.availableCount ?? day.slots?.filter((s) => s.available).length) > 0)
  return (found ?? list[0])?.date ?? null
}

export const isSelectable = (slot) => slot?.available === true

/** Tìm khung theo chuỗi `start`; null nếu không có. */
export function findSlot(days, start) {
  for (const day of Array.isArray(days) ? days : []) {
    const slot = day.slots?.find((item) => item.start === start)
    if (slot) return slot
  }
  return null
}

/**
 * Mô tả một khung để hiển thị: giờ VN, trạng thái, lý do bằng tiếng Việt.
 * `CAR_BOOKED` kèm tên xe bị kín (tra theo `carNames`: id → tên); không biết tên thì bỏ phần tên.
 *
 * @param {{ start: string, available: boolean, reason?: string, carIds?: string[] }} slot
 * @param {Record<string, string>} [carNames]
 * @returns {{ time: string, available: boolean, reason: string|null, note: string, label: string }}
 *          `note` là phần mô tả ngắn (hiện dưới giờ), `label` = `giờ - note` (dùng cho aria-label).
 */
export function describeSlot(slot, carNames = {}) {
  const time = formatVnTime(slot.start)
  if (slot.available) return { time, available: true, reason: null, note: 'còn trống', label: `${time} - còn trống` }

  const base = SLOT_REASON_LABEL[slot.reason] ?? 'Không đặt được'
  const names = (slot.carIds ?? []).map((id) => carNames[id]).filter(Boolean)
  const note = slot.reason === 'CAR_BOOKED' && names.length > 0 ? `${base}: ${names.join(', ')}` : base
  return { time, available: false, reason: slot.reason ?? null, note, label: `${time} - ${note}` }
}
