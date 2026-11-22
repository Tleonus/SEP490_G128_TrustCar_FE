// Khi nào tự tải lại danh sách lượt của nhân viên: chỉ khi quay lại tab sau ≥ 30 giây; không thăm dò.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F30, #NFR-F06 và CONTEXT.md G3

import { AUTO_REFRESH_MS, AUTO_REFRESH_PAUSE_MS, REFRESH_MIN_INTERVAL_MS } from '../constants/testDriveConstants'

/**
 * Còn bao nhiêu ms nữa thì tự tải ngầm lần kế tiếp (G10): 60 giây sau lần tải gần nhất xong (thành công hoặc
 * thất bại), hoặc 5 phút nếu lần đó bị BE từ chối vì quá nhiều yêu cầu (429). Chưa từng tải → null (không lên lịch).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F44
 * @param {number|null} settledAt   Mốc (ms) lần tải gần nhất kết thúc
 * @param {number|null} silentStatus  Mã HTTP của lần tải ngầm gần nhất nếu lỗi, hoặc null
 * @returns {number|null}
 */
export function autoRefreshDelay(settledAt, silentStatus = null, now = Date.now()) {
  if (typeof settledAt !== 'number' || !Number.isFinite(settledAt)) return null
  const wait = silentStatus === 429 ? AUTO_REFRESH_PAUSE_MS : AUTO_REFRESH_MS
  return Math.max(0, settledAt + wait - now)
}

/**
 * Có nên tải lại khi tab trở lại không? `loadedAt` là mốc (ms) lần tải thành công gần nhất.
 * Chưa từng tải (null) thì không tự tải: lần tải đầu do trang lo.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F30
 */
export function shouldRefreshOnFocus(loadedAt, now = Date.now()) {
  if (typeof loadedAt !== 'number' || !Number.isFinite(loadedAt)) return false
  return now - loadedAt >= REFRESH_MIN_INTERVAL_MS
}
