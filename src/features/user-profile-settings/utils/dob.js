// Ngày sinh được giữ dưới dạng chuỗi `YYYY-MM-DD` từ ô nhập tới API, không bao giờ qua `new Date('YYYY-MM-DD')`
// (chuỗi đó được hiểu là UTC nên ở múi giờ âm sẽ lệch về ngày hôm trước). Mọi phép so sánh là so sánh chuỗi.

export const OLDEST_DOB = '1900-01-01'

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/
const pad = (n) => String(n).padStart(2, '0')

/**
 * Ngày hôm nay theo giờ địa phương của người dùng, dạng YYYY-MM-DD (dùng cho `max` của ô ngày).
 * @param {Date} [now]
 */
export function todayLocalISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * `2000-05-20` → `20/05/2000` bằng cách cắt chuỗi (không lệch múi giờ). Rỗng/null → ''.
 * @ears .sdd/features/user-profile-settings/SPEC.md#NFR-F05
 */
export function formatDob(iso) {
  if (typeof iso !== 'string' || !DATE_KEY.test(iso)) return ''
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/** Ngày có thật trong lịch (từ chối 2000-02-31), tính bằng số học UTC nên không phụ thuộc múi giờ máy. */
function isRealDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * Ngày sinh hợp lệ: đúng định dạng, ngày có thật, từ 1900-01-01 tới hôm nay (so sánh chuỗi).
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F05
 * @param {string} iso
 * @param {string} todayISO  Ngày hôm nay `YYYY-MM-DD`.
 */
export function isValidDob(iso, todayISO) {
  const match = typeof iso === 'string' ? DATE_KEY.exec(iso) : null
  if (!match) return false
  if (!isRealDate(Number(match[1]), Number(match[2]), Number(match[3]))) return false
  return iso >= OLDEST_DOB && iso <= todayISO
}
