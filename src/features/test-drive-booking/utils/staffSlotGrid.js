// Mô tả khung giờ trong lưới của nhân viên (GET /appointments/slots): chỗ còn lại, lý do, khách đang đặt.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F32, #REQ-F33 và API-TEST-DRIVE-BOOKING 1.1.0

import { STAFF_SLOT_REASON_LABEL, VISIT_STATUS } from '../constants/testDriveConstants'
import { formatVnTime } from './vnTime'

const carText = (car) => [car?.make, car?.model].filter(Boolean).join(' ') || car?.vehicleCode || 'Xe'

/** Một lượt đang đặt trong khung → dòng hiển thị cho nhân viên (tên, SĐT, xe). */
export function summarizeVisit(visit) {
  const status = VISIT_STATUS[visit?.status]
  return {
    key: visit?.visitId ?? visit?.visitCode,
    code: visit?.visitCode ?? '',
    statusLabel: status?.label ?? visit?.status ?? '',
    statusColor: status?.color ?? 'default',
    name: visit?.customer?.fullName ?? '',
    phone: visit?.customer?.phone ?? '',
    cars: (visit?.cars ?? []).map(carText).join(', '),
  }
}

/**
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F32
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F33
 * @param {{ start: string, available: boolean, capacityRemaining?: number, reason?: string|null, carIds?: string[], visits?: object[] }} slot
 * @param {Record<string, string>} [carNames] id xe → tên, nêu tên xe kín khi `CAR_BOOKED`
 * @returns {{ time: string, selectable: boolean, past: boolean, remaining: number, note: string, label: string, visits: object[] }}
 *   `selectable`: chọn được; `past`: khung đã qua (mờ); `label` dùng cho `aria-label`.
 */
export function describeStaffSlot(slot, carNames = {}) {
  const time = formatVnTime(slot?.start)
  const remaining = Math.max(0, Number(slot?.capacityRemaining) || 0)
  const selectable = slot?.available === true
  const visits = (Array.isArray(slot?.visits) ? slot.visits : []).map(summarizeVisit)

  let note
  if (selectable) {
    note = `còn ${remaining} chỗ`
  } else {
    const base = STAFF_SLOT_REASON_LABEL[slot?.reason] ?? 'Không đặt được'
    const names = (slot?.carIds ?? []).map((id) => carNames[id]).filter(Boolean)
    note = slot?.reason === 'CAR_BOOKED' && names.length > 0 ? `${base}: ${names.join(', ')}` : base
  }
  return { time, selectable, past: slot?.reason === 'PAST', remaining, note, label: `${time} - ${note}`, visits }
}
