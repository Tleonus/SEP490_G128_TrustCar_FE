// Giờ Việt Nam (UTC+7) độc lập múi giờ trình duyệt: mọi thời điểm hiển thị và so sánh đều qua đây.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F18

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const HOUR_MS = 3600 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Các phần của thời điểm theo giờ VN, hoặc null nếu không phải ngày hợp lệ. */
function partsOf(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]))
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute }
}

/** `10/11/2026` (giờ VN). */
export function formatVnDate(value) {
  const p = partsOf(value)
  return p ? `${p.day}/${p.month}/${p.year}` : ''
}

/** `10:00` (giờ VN). */
export function formatVnTime(value) {
  const p = partsOf(value)
  return p ? `${p.hour}:${p.minute}` : ''
}

/** `10:00 10/11/2026` (giờ VN). */
export function formatVnDateTime(value) {
  const p = partsOf(value)
  return p ? `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year}` : ''
}

/** `YYYY-MM-DD` của thời điểm theo giờ VN. */
export function vnDayKey(value) {
  const p = partsOf(value)
  return p ? `${p.year}-${p.month}-${p.day}` : ''
}

/** Cộng/trừ ngày trên khóa `YYYY-MM-DD` (lịch dương, không phụ thuộc múi giờ). */
export function addDays(dayKey, amount) {
  const [y, m, d] = dayKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) + amount * DAY_MS).toISOString().slice(0, 10)
}

/** Nhãn thứ ngắn của khóa ngày: `T2` … `T7`, `CN`. */
export function weekdayLabel(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

/** `10/11` từ khóa `YYYY-MM-DD`. */
export function shortDate(dayKey) {
  const [, m, d] = dayKey.split('-')
  return `${d}/${m}`
}

/** Hai giá trị (chuỗi ISO có offset khác nhau, hoặc Date) là cùng một thời điểm? Thiếu một bên → false. */
export function sameInstant(a, b) {
  if (!a || !b) return false
  return new Date(a).getTime() === new Date(b).getTime()
}

/** Số giờ từ `now` đến `value` (âm nếu đã qua). */
export function hoursUntil(value, now = new Date()) {
  return (new Date(value).getTime() - now.getTime()) / HOUR_MS
}
