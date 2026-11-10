// Luật hiển thị lượt lái thử: hủy được không, nút nào của nhân viên bật, xe nào đã bị hủy.
// BE vẫn là nguồn quyết định; các hàm này chỉ để bật/tắt nút và gợi ý.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F10, #REQ-F11, #REQ-F15 và BE Spec C5

import { LATE_CANCEL_HOURS } from '../constants/testDriveConstants'
import { hoursUntil } from './vnTime'

const OPEN = ['PENDING', 'CONFIRMED']

export const isOpenVisit = (visit) => OPEN.includes(visit?.status)

/**
 * Khách hủy được khi lượt còn mở và chưa tới giờ hẹn.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F11
 */
export function canCancel(visit, now = new Date()) {
  return isOpenVisit(visit) && hoursUntil(visit.scheduledAt, now) > 0
}

/**
 * Hủy bây giờ sẽ bị ghi nhận "hủy sát giờ"? (< 12 giờ trước giờ hẹn). Chỉ là gợi ý;
 * BE còn miễn cho 30 phút đầu sau khi đặt nên cảnh báo chỉ nói "có thể".
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F11
 */
export function isLateHint(visit, now = new Date()) {
  return canCancel(visit, now) && hoursUntil(visit.scheduledAt, now) < LATE_CANCEL_HOURS
}

/**
 * Xe này đã bị tự hủy riêng (lượt chưa hủy mà lịch con đã hủy; chỉ xảy ra khi xe ngừng bán).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F10
 */
export const isCarCancelled = (visit, appointment) =>
  appointment?.status === 'CANCELLED' && visit?.status !== 'CANCELLED'

/**
 * Các thao tác nhân viên được bật theo bảng chuyển trạng thái C5.
 * `COMPLETED` / `NO_SHOW` chỉ khi đã tới giờ hẹn.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F15
 * @returns {string[]} danh sách trạng thái đích
 */
export function staffActions(visit, now = new Date()) {
  if (visit?.status === 'PENDING') return ['CONFIRMED', 'CANCELLED']
  if (visit?.status !== 'CONFIRMED') return []
  const started = hoursUntil(visit.scheduledAt, now) <= 0
  return started ? ['COMPLETED', 'NO_SHOW', 'CANCELLED'] : ['CANCELLED']
}

/**
 * Id các xe "không còn bán" của lượt, để nhân viên gọi báo khách: xe bị tự hủy hoặc xe còn lịch mở
 * nhưng trạng thái hiện tại không phải AVAILABLE.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F13
 */
export function unavailableCarIds(visit) {
  return (visit?.appointments ?? [])
    .filter((a) => isCarCancelled(visit, a)
      || visit.cancellationType === 'CAR_UNAVAILABLE'
      || (OPEN.includes(a.status) && a.car?.status && a.car.status !== 'AVAILABLE'))
    .map((a) => a.car?._id)
    .filter(Boolean)
}

export const hasUnavailableCar = (visit) => unavailableCarIds(visit).length > 0
