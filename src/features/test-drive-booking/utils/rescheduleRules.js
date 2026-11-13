// Luật hiển thị nút "Đổi lịch" của khách và câu giải thích khi không đổi được.
// BE là nguồn quyết định (`canReschedule`); các hằng số 12 giờ / 2 lần chỉ để chọn câu (FA11).
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F25

import {
  MAX_RESCHEDULES,
  RESCHEDULE_HINT,
  RESCHEDULE_MIN_HOURS,
} from '../constants/testDriveConstants'
import { hoursUntil } from './vnTime'
import { isOpenVisit } from './visitRules'

/**
 * Nút "Đổi lịch" có bật không, và nếu không thì nói gì thay cho nút.
 * Lượt đã đóng hoặc đã tới giờ hẹn: không nút, không câu.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F25
 * @returns {{ canReschedule: boolean, message: string|null }}
 */
export function rescheduleHint(visit, now = new Date()) {
  const hours = hoursUntil(visit?.scheduledAt, now)
  if (!isOpenVisit(visit) || !(hours > 0)) return { canReschedule: false, message: null }
  if (visit.canReschedule === true) return { canReschedule: true, message: null }
  if ((visit.rescheduleCount ?? 0) >= MAX_RESCHEDULES) return { canReschedule: false, message: RESCHEDULE_HINT.MAX_REACHED }
  if (hours < RESCHEDULE_MIN_HOURS) return { canReschedule: false, message: RESCHEDULE_HINT.TOO_LATE }
  return { canReschedule: false, message: RESCHEDULE_HINT.OTHER }
}

/**
 * "Đã đổi lịch n lần" chỉ hiện khi n > 0.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F25
 */
export const rescheduledText = (visit) => {
  const count = Number(visit?.rescheduleCount) || 0
  return count > 0 ? `Đã đổi lịch ${count} lần` : null
}
