// Bỏ phản hồi cũ đến sau (tìm khách) và kiểm từ khóa tìm đủ dài.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F35 và FA17

import { CUSTOMER_SEARCH_MIN_CHARS } from '../constants/testDriveConstants'

/**
 * Bộ đếm "lần gửi mới nhất": `next()` cấp số cho lần gửi mới, `isCurrent(số)` chỉ đúng với số mới nhất.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F35
 */
export function makeLatest() {
  let current = 0
  return {
    next: () => {
      current += 1
      return current
    },
    isCurrent: (token) => token === current,
  }
}

/**
 * Từ khóa đủ để gọi API tìm khách (≥ 3 ký tự sau khi cắt khoảng trắng đầu cuối).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F35
 */
export const isSearchable = (query) => String(query ?? '').trim().length >= CUSTOMER_SEARCH_MIN_CHARS
