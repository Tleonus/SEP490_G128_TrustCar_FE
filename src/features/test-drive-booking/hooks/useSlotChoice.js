import { useState } from 'react'
import { findSlot, firstAvailableDay, isSelectable } from '../utils/slotGrid'
import { sameInstant } from '../utils/vnTime'

/**
 * Ngày và khung đang chọn trên một lưới đã tải. Chỉ có giá trị khi dữ liệu mới nhất còn cho phép:
 * ngày không còn trong lưới → ngày gần nhất còn khung; khung không còn chọn được (hoặc là giờ hiện tại của lượt
 * đang đổi) → không có khung hợp lệ.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F26
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F34
 * @param {{ days: object[] }} slots
 * @param {string} [lockedStart]  Giờ hiện tại của lượt đang đổi (ISO), không được chọn lại
 */
export function useSlotChoice(slots, lockedStart) {
  const [dateKey, setDateKey] = useState(null)
  const [start, setStart] = useState(null)

  const activeDate = slots.days.some((day) => day.date === dateKey) ? dateKey : firstAvailableDay(slots.days)
  const chosen = findSlot(slots.days, start)
  const validStart = chosen && isSelectable(chosen) && !sameInstant(chosen.start, lockedStart) ? start : null

  return { activeDate, validStart, selectDate: setDateKey, selectSlot: setStart, clearSlot: () => setStart(null) }
}
