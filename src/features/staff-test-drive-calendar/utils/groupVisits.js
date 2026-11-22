// Gom lượt lái thử theo ngày và khung giờ (giờ VN) để vẽ lịch. Thuần logic, không phụ thuộc múi giờ trình duyệt.
// Ref: .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F05..F09, #REQ-F23 (CF3, CF13)

import { vnDayKey, formatVnTime } from '../../test-drive-booking/utils/vnTime'
import { hasUnavailableCar } from '../../test-drive-booking/utils/visitRules'
import { OUTCOME_LABEL, PIN_LABEL, REMINDER_LABEL } from '../../test-drive-booking/constants/testDriveConstants'
import { OTHER_SLOT, SLOT_TIMES, UNAVAILABLE_CAR_LABEL } from '../constants/calendarConstants'

const byTimeThenCode = (a, b) => (
  new Date(a.scheduledAt) - new Date(b.scheduledAt) || String(a.visitCode).localeCompare(String(b.visitCode))
)

const emptySlots = () => Object.fromEntries([...SLOT_TIMES, OTHER_SLOT].map((slot) => [slot, []]))

/**
 * Khung của một thời điểm: `'08:00' | '10:00' | '13:00' | '15:00'`, hoặc `'other'` cho giờ lạ (dữ liệu cũ).
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F05
 */
export function slotOf(scheduledAt) {
  const time = formatVnTime(scheduledAt)
  return SLOT_TIMES.includes(time) ? time : OTHER_SLOT
}

/**
 * Gom lượt theo ngày VN rồi theo khung. Lượt hủy bị bỏ khi `showCancelled` tắt (không đếm vào `total`);
 * lượt không có giờ hợp lệ bị bỏ vì không biết đặt vào ngày nào.
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F05
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F07
 * @param {object[]} items
 * @param {{ showCancelled?: boolean }} [options]
 * @returns {Map<string, { total: number, slots: Record<string, object[]> }>}
 */
export function groupByDay(items, { showCancelled = false } = {}) {
  const days = new Map()
  for (const visit of items ?? []) {
    if (!visit?.scheduledAt) continue // `new Date(null)` là năm 1970: loại trước khi tính ngày
    if (!showCancelled && visit.status === 'CANCELLED') continue
    const dayKey = vnDayKey(visit.scheduledAt)
    if (!dayKey) continue
    const entry = days.get(dayKey) ?? { total: 0, slots: emptySlots() }
    entry.slots[slotOf(visit.scheduledAt)].push(visit)
    entry.total += 1
    days.set(dayKey, entry)
  }
  for (const entry of days.values()) {
    for (const list of Object.values(entry.slots)) list.sort(byTimeThenCode)
  }
  return days
}

/** Mọi lượt của ngày theo thứ tự giờ (khung chuẩn rồi giờ lạ). */
export function visitsOfDay(entry) {
  if (!entry) return []
  return [...SLOT_TIMES.flatMap((slot) => entry.slots[slot]), ...entry.slots[OTHER_SLOT]]
}

/**
 * Các dòng hiện trong ô ngày của lưới tháng: tối đa `max` lượt, phần còn lại gộp thành "+N".
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F08
 * @returns {{ lines: object[], more: number }}
 */
export function dayLines(entry, max) {
  const all = visitsOfDay(entry)
  return { lines: all.slice(0, max), more: Math.max(0, all.length - max) }
}

/** `10:00 · Nguyễn An · 2 xe` */
export function visitLine(visit) {
  const name = visit?.customer?.fullName || '(không rõ)'
  const cars = visit?.appointments?.length ?? 0
  return [formatVnTime(visit?.scheduledAt), name, cars > 0 ? `${cars} xe` : null].filter(Boolean).join(' · ')
}

/**
 * Nhãn chữ nhắc việc của một lượt (không chỉ dựa vào màu).
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F06
 * @returns {Array<{ key: string, label: string }>}
 */
export function badgesOf(visit) {
  const badges = []
  if (visit?.isNewRequest) badges.push({ key: 'new', label: PIN_LABEL })
  if (visit?.needsReminderCall) badges.push({ key: 'reminder', label: REMINDER_LABEL })
  if (visit?.needsOutcome) badges.push({ key: 'outcome', label: OUTCOME_LABEL })
  if (visit?.appointments && hasUnavailableCar(visit)) badges.push({ key: 'unavailable', label: UNAVAILABLE_CAR_LABEL })
  return badges
}
