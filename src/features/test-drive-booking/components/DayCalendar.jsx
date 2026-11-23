/**
 * KAN-90 – Lịch tháng để chọn ngày trong modal đặt lịch lái thử (chỉ dùng cho khách).
 *
 * Lưới tháng kiểu lịch (CN → T7) bên trái, chuyển tháng bằng hai nút ‹ ›. Chỉ những ngày có
 * trong danh sách `days` do Backend trả (14 ngày tới) mới bấm được; ngày ngoài phạm vi bị làm mờ.
 * Ngày kín vẫn bấm được để xem khung giờ (mọi khung đều bị khoá), giống dải thẻ ngày cũ.
 */

import { useState } from 'react'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { formatVnDate, vnDayKey, weekdayLabel } from '../utils/vnTime'
import styles from '../styles/BookingGuest.module.css'

/** Thứ tự cột theo lịch Việt Nam: Chủ nhật đứng đầu. */
const WEEK_HEADERS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/** `2026-11-24` → `2026-11`. */
const monthOf = (dateKey) => String(dateKey || '').slice(0, 7)

/** "Tháng 11/2026" từ khóa `YYYY-MM`. */
function monthLabel(monthKey) {
  const [year, month] = String(monthKey).split('-')
  return `Tháng ${Number(month)}/${year}`
}

/** Dựng lưới ô của một tháng: các ô trống đầu tuần + khóa ngày `YYYY-MM-DD`. */
function buildCells(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number)
  if (!year || !month) return []
  const lead = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells = Array.from({ length: lead }, () => null)
  for (let day = 1; day <= total; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  return cells
}

/** Dịch khóa tháng `n` tháng; giữ nguyên định dạng `YYYY-MM`. */
function shiftMonth(monthKey, amount) {
  const [year, month] = String(monthKey).split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1 + amount, 1))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * @param {object[]} days          Kết quả groupDays (đã sắp tăng dần theo ngày)
 * @param {string} selectedDate    Khóa YYYY-MM-DD đang chọn
 * @param {(date: string) => void} onSelectDate
 */
export default function DayCalendar({ days, selectedDate, onSelectDate }) {
  const list = Array.isArray(days) ? days : []
  const firstMonth = monthOf(list[0]?.date)
  const lastMonth = monthOf(list[list.length - 1]?.date)

  // Tháng đang xem chỉ đổi khi người dùng bấm ‹ ›; mặc định mở đúng tháng của ngày đang chọn.
  const [month, setMonth] = useState(() => monthOf(selectedDate) || firstMonth)

  if (!firstMonth) return null

  const byDate = new Map(list.map((item) => [item.date, item]))
  const todayKey = vnDayKey(new Date())
  const cells = buildCells(month)
  const canPrev = month > firstMonth
  const canNext = month < lastMonth

  return (
    <div className={styles.calendar}>
      <div className={styles.calHead}>
        <span className={styles.calTitle}>{monthLabel(month)}</span>
        <span className={styles.calNav}>
          <button
            type="button"
            className={styles.calNavBtn}
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            disabled={!canPrev}
            aria-label="Tháng trước"
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className={styles.calNavBtn}
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            disabled={!canNext}
            aria-label="Tháng sau"
          >
            <RightOutlined />
          </button>
        </span>
      </div>

      <div className={styles.calWeek} aria-hidden>
        {WEEK_HEADERS.map((label) => (
          <span key={label} className={styles.calWeekday}>{label}</span>
        ))}
      </div>

      <div className={styles.calGrid} role="group" aria-label={`Chọn ngày trong ${monthLabel(month)}`}>
        {cells.map((dateKey, index) => {
          if (!dateKey) return <span key={`empty-${index}`} className={styles.calEmpty} aria-hidden />

          const item = byDate.get(dateKey)
          const dayNumber = Number(dateKey.slice(8, 10))

          // Ngày ngoài phạm vi Backend trả về: hiện mờ, không bấm được.
          if (!item) {
            return (
              <span key={dateKey} className={`${styles.calCell} ${styles.calNoData}`} aria-hidden>
                <span className={styles.calNum}>{dayNumber}</span>
              </span>
            )
          }

          const chosen = dateKey === selectedDate
          const empty = item.availableCount === 0
          return (
            <button
              key={dateKey}
              type="button"
              className={[
                styles.calCell,
                styles.calCellDay,
                chosen && styles.calSelected,
                dateKey === todayKey && !chosen && styles.calToday,
              ].filter(Boolean).join(' ')}
              aria-pressed={chosen}
              aria-label={`${weekdayLabel(dateKey)}, ${formatVnDate(`${dateKey}T12:00:00+07:00`)}, ${item.availableCount} khung còn trống`}
              onClick={() => onSelectDate(dateKey)}
            >
              <span className={styles.calNum}>{dayNumber}</span>
              <span className={`${styles.calDot} ${empty ? styles.calDotFull : ''}`} aria-hidden />
            </button>
          )
        })}
      </div>
    </div>
  )
}
