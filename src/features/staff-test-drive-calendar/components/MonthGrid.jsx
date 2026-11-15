import { weekdayLabel } from '../../test-drive-booking/utils/vnTime'
import { MAX_LINES_PER_DAY } from '../constants/calendarConstants'
import { dayLabel, inMonthOf, monthMatrix } from '../utils/calendarRange'
import { dayLines, visitsOfDay } from '../utils/groupVisits'
import VisitChip from './VisitChip'
import styles from '../styles/CalendarGrids.module.css'

const dayNumber = (dayKey) => Number(dayKey.slice(8))

/** Ô ngày trên màn hình hẹp: MỘT nút (số ngày, số lượt, tối đa 3 chấm màu). Bấm mở Drawer của ngày. */
function NarrowCell({ day, entry, isToday, inMonth, onOpenDay }) {
  const visits = visitsOfDay(entry)
  const total = entry?.total ?? 0
  const cls = [styles.day, inMonth ? '' : styles.dayOut, isToday ? styles.dayToday : ''].join(' ')
  return (
    <div className={cls}>
      <button
        type="button"
        className={styles.cellButton}
        onClick={() => onOpenDay(day)}
        aria-label={`${dayLabel(day)}${isToday ? ', hôm nay' : ''}, ${total} lượt`}
      >
        <span>{dayNumber(day)}</span>
        <span className={styles.dots} aria-hidden="true">
          {visits.slice(0, 3).map((visit) => (
            <span key={visit.visitId} className={`${styles.dot} ${styles[`s_${visit.status}`] ?? styles.s_CANCELLED}`} />
          ))}
        </span>
        {total > 0 && <span className={styles.count}>{total} lượt</span>}
      </button>
    </div>
  )
}

/** Ô ngày trên màn hình rộng: số ngày (mở Drawer), tối đa 3 lượt, "+N lượt nữa". */
function WideCell({ day, entry, isToday, inMonth, onOpenDay, onOpenVisit }) {
  const { lines, more } = dayLines(entry, MAX_LINES_PER_DAY)
  const total = entry?.total ?? 0
  const cls = [styles.day, inMonth ? '' : styles.dayOut, isToday ? styles.dayToday : ''].join(' ')
  return (
    <div className={cls}>
      <button
        type="button"
        className={styles.dayHead}
        onClick={() => onOpenDay(day)}
        aria-label={`Mở ${dayLabel(day)}${isToday ? ', hôm nay' : ''}, ${total} lượt`}
      >
        <span>{dayNumber(day)}</span>
        {isToday && <span className={styles.todayTag}>Hôm nay</span>}
      </button>
      {lines.map((visit) => <VisitChip key={visit.visitId} visit={visit} onOpen={onOpenVisit} />)}
      {more > 0 && (
        <button type="button" className={styles.more} onClick={() => onOpenDay(day)}>+{more} lượt nữa</button>
      )}
    </div>
  )
}

/**
 * Lưới tháng: 7 cột T2…CN, mỗi ô là một ngày (ngày ngoài tháng làm mờ, hôm nay có viền và nhãn chữ).
 * Màn hình hẹp dùng ô nút duy nhất để không cuộn ngang và bấm được ≥ 40px.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F03
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F08
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F17
 * @param {string} anchor       Ngày bất kỳ trong tháng đang xem
 * @param {Map<string, object>} days   Kết quả `groupByDay`
 * @param {string} today        `YYYY-MM-DD` giờ VN
 * @param {boolean} narrow
 * @param {(dayKey: string) => void} onOpenDay
 * @param {(visit: object) => void} onOpenVisit
 */
export default function MonthGrid({ anchor, days, today, narrow, onOpenDay, onOpenVisit }) {
  const { weeks } = monthMatrix(anchor)
  const Cell = narrow ? NarrowCell : WideCell
  return (
    <div role="group" aria-label="Lịch tháng" className={styles.monthScroll}>
      <div className={styles.monthInner}>
        <div className={styles.weekdays} aria-hidden="true">
          {weeks[0].map((day) => <div key={day} className={styles.weekday}>{weekdayLabel(day)}</div>)}
        </div>
        <div className={styles.month}>
          {weeks.flat().map((day) => (
            <Cell
              key={day}
              day={day}
              entry={days.get(day)}
              isToday={day === today}
              inMonth={inMonthOf(day, anchor)}
              onOpenDay={onOpenDay}
              onOpenVisit={onOpenVisit}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
