// Giờ Việt Nam (UTC+7) CÓ GIÂY, độc lập múi giờ trình duyệt: `dd/mm/yyyy hh:mm:ss`.
// (`formatVnDateTime` của test-drive-booking không có giây nên không dùng được cho nhật ký.)
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F03, NFR-F05

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/**
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F03
 * @param {string|number|Date|null|undefined} value Chuỗi ISO của `createdAt`
 * @returns {string} `15/11/2026 00:30:00`, hoặc chuỗi rỗng nếu thiếu/không hợp lệ
 */
export function formatAuditTime(value) {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const p = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`
}
