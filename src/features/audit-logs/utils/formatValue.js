// Đổi một giá trị bất kỳ lấy từ nhật ký thành VĂN BẢN THUẦN để hiển thị. Giá trị có thể do người dùng nhập
// (ghi chú, tóm tắt…) nên KHÔNG bao giờ trả HTML: component chỉ render bằng `{text}` của React (tự thoát ký tự).
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F13 (CF7)

import { VALUE_HARD_LIMIT, VALUE_MAX_DEPTH, VALUE_PREVIEW_CHARS } from '../constants/auditConstants'

const EMPTY = '—'
const CYCLE = '[vòng lặp]'
const TOO_DEEP = '[quá sâu]'
const CUT = '… (đã cắt)'

/** Bản sao thuần của `value` an toàn để `JSON.stringify` (chặn vòng lặp và độ sâu quá lớn). */
function toPlain(value, depth, seen) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value
  if (value === undefined) return null
  if (typeof value === 'bigint') return String(value)
  if (typeof value !== 'object') return `[${typeof value}]`
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString()
  if (seen.has(value)) return CYCLE
  if (depth >= VALUE_MAX_DEPTH) return TOO_DEEP
  seen.add(value)
  const plain = Array.isArray(value)
    ? value.map((item) => toPlain(item, depth + 1, seen))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPlain(item, depth + 1, seen)]))
  seen.delete(value)
  return plain
}

const hardCut = (text) => (text.length > VALUE_HARD_LIMIT ? `${text.slice(0, VALUE_HARD_LIMIT)}${CUT}` : text)

/**
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F13
 * @param {*} value
 * @returns {{ text: string, full: string, truncated: boolean }}
 *   `text`: bản xem trước (≤ 300 ký tự); `full`: toàn bộ (≤ 20 000 ký tự, dài hơn bị cắt kèm ghi chú); `truncated`: `text` ≠ `full`.
 *   Luôn là chuỗi, không bao giờ ném lỗi.
 */
export function formatValue(value) {
  let full
  if (value === null || value === undefined) full = EMPTY
  else if (typeof value === 'string') full = hardCut(value)
  else if (typeof value === 'object') {
    try {
      full = hardCut(JSON.stringify(toPlain(value, 0, new WeakSet())))
    } catch {
      full = '[không hiển thị được]'
    }
  } else full = hardCut(String(toPlain(value, 0, new WeakSet())))

  const truncated = full.length > VALUE_PREVIEW_CHARS
  return { text: truncated ? `${full.slice(0, VALUE_PREVIEW_CHARS)}…` : full, full, truncated }
}

/** JSON dễ đọc (thụt lề) cho khung `metadata`, cùng giới hạn an toàn; luôn trả chuỗi. */
export function prettyJson(value) {
  if (value === null || value === undefined) return EMPTY
  try {
    return hardCut(JSON.stringify(toPlain(value, 0, new WeakSet()), null, 2))
  } catch {
    return '[không hiển thị được]'
  }
}
