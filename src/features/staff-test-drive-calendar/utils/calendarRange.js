// Dựng lưới lịch và khoảng ngày cần tải. Mọi phép tính qua khóa ngày `YYYY-MM-DD` (lịch dương, giờ VN),
// không dùng múi giờ của trình duyệt.
// Ref: .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F02, #REQ-F03, #REQ-F05 (CF4)

import { addDays, vnDayKey, weekdayLabel } from '../../test-drive-booking/utils/vnTime'
import { MODE } from '../constants/calendarConstants'

const pad = (n) => String(n).padStart(2, '0')
const parts = (dayKey) => dayKey.split('-').map(Number)
const dmy = (key) => key.split('-').reverse().join('/')
const dm = (key) => dmy(key).slice(0, 5)

/** Ngày hôm nay theo giờ VN. */
export const todayKey = (now = new Date()) => vnDayKey(now)

/** 0 = thứ Hai … 6 = Chủ nhật. */
function mondayIndex(dayKey) {
  const [y, m, d] = parts(dayKey)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

/** Thứ Hai của tuần chứa ngày này. */
export const weekStart = (dayKey) => addDays(dayKey, -mondayIndex(dayKey))

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate()

/** 7 ngày của tuần chứa `anchor`, bắt đầu thứ Hai. */
export function weekDays(anchor) {
  const start = weekStart(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/**
 * Lưới tháng của `anchor`: các tuần đủ 7 ngày (có cả ngày ngoài tháng), `from`/`to` là ngày đầu/cuối của lưới.
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F02
 * @returns {{ weeks: string[][], from: string, to: string, month: string }}
 */
export function monthMatrix(anchor) {
  const [year, month] = parts(anchor)
  const first = `${year}-${pad(month)}-01`
  const last = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`
  const from = weekStart(first)
  const to = addDays(weekStart(last), 6)
  const weeks = []
  for (let day = from; day <= to; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)))
  }
  return { weeks, from, to, month: `${year}-${pad(month)}` }
}

/**
 * Khoảng ngày cần tải cho chế độ đang xem (bao cả ngày ngoài tháng của lưới).
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F02
 * @returns {{ from: string, to: string }}
 */
export function rangeOf(mode, anchor) {
  if (mode === MODE.WEEK) {
    const days = weekDays(anchor)
    return { from: days[0], to: days[6] }
  }
  const { from, to } = monthMatrix(anchor)
  return { from, to }
}

/**
 * Kỳ trước/sau (`dir` = -1 hoặc 1). Tháng: giữ cùng ngày nếu có, không thì lùi về ngày cuối tháng đích.
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F03
 */
export function shiftAnchor(mode, anchor, dir) {
  if (mode === MODE.WEEK) return addDays(anchor, 7 * dir)
  const [year, month, day] = parts(anchor)
  const index = year * 12 + (month - 1) + dir
  const targetYear = Math.floor(index / 12)
  const targetMonth = (index % 12) + 1
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth))
  return `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`
}

/** Tiêu đề kỳ: `Tháng 11/2026` hoặc `16/11 – 22/11/2026`. */
export function titleOf(mode, anchor) {
  if (mode === MODE.WEEK) {
    const days = weekDays(anchor)
    return `${dm(days[0])} – ${dmy(days[6])}`
  }
  const [year, month] = parts(anchor)
  return `Tháng ${month}/${year}`
}

/** `T3, 17/11/2026` (tiêu đề Drawer, nhãn truy cập). */
export const dayLabel = (dayKey) => `${weekdayLabel(dayKey)}, ${dmy(dayKey)}`

/** Ngày này có thuộc tháng của `anchor` không (để làm mờ ngày ngoài tháng). */
export const inMonthOf = (dayKey, anchor) => dayKey.slice(0, 7) === anchor.slice(0, 7)
