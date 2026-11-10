// Hộp hủy của nhân viên: chọn một lý do có sẵn + ghi chú nội bộ; "Khác" bắt buộc có ghi chú.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F31 và CONTEXT.md G2

import { CANCEL_REASON_OTHER, NOTE_MAX, STAFF_CANCEL_REASONS } from '../constants/testDriveConstants'

const trimmed = (value) => String(value ?? '').trim()
const isKnownCode = (code) => STAFF_CANCEL_REASONS.some((reason) => reason.code === code)

/**
 * Đủ điều kiện gửi chưa? Phải chọn một lý do có sẵn; "Khác" cần ghi chú; ghi chú không quá 300 ký tự.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F31
 */
export function isCancelReady({ code, note } = {}) {
  if (!isKnownCode(code)) return false
  const text = trimmed(note)
  if (text.length > NOTE_MAX) return false
  return code !== CANCEL_REASON_OTHER || text.length > 0
}

/**
 * Thân yêu cầu `PATCH /appointments/:id/status`. Ghi chú đã cắt khoảng trắng; rỗng thì không gửi `reason`.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F31
 */
export function buildCancelBody({ code, note }) {
  const body = { status: 'CANCELLED', reasonCode: code }
  const text = trimmed(note)
  if (text) body.reason = text
  return body
}
