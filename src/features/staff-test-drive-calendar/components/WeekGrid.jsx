import { shortDate, weekdayLabel } from '../../test-drive-booking/utils/vnTime'
import { OTHER_SLOT, OTHER_SLOT_LABEL, SLOT_TIMES } from '../constants/calendarConstants'
import { dayLabel, weekDays } from '../utils/calendarRange'
import DayAgenda from './DayAgenda'
import VisitChip from './VisitChip'
import grid from '../styles/CalendarGrids.module.css'
import styles from '../styles/StaffCalendar.module.css'

const cellClass = (isToday) => `${grid.cell}${isToday ? ` ${grid.cellToday}` : ''}`

/** Tuần trên màn hình hẹp: danh sách dọc, mỗi ngày một khối, chỉ liệt kê khung có lượt. */
function WeekList({ anchor, days, today, onOpenVisit }) {
  return (
    <div className={styles.agenda} role="group" aria-label="Lịch tuần">
      {weekDays(anchor).map((day) => {
        const entry = days.get(day)
        return (
          <section key={day} className={grid.dayBlock} aria-label={dayLabel(day)}>
            <h3 className={grid.dayTitle}>
              {dayLabel(day)}{day === today && <> <span className={grid.todayTag}>Hôm nay</span></>}
            </h3>
            {(entry?.total ?? 0) === 0
              ? <p className={styles.slotEmpty}>Không có lượt</p>
              : <DayAgenda entry={entry} onOpenVisit={onOpenVisit} showEmpty={false} />}
          </section>
        )
      })}
    </div>
  )
}

/** Một hàng của lưới tuần: nhãn giờ + 7 ô ngày (mỗi ô liệt kê MỌI lượt của khung). */
function WeekRow({ slot, columns, days, today, onOpenVisit }) {
  return (
    <>
      <div className={`${grid.cell} ${grid.timeCell}`}>{slot === OTHER_SLOT ? OTHER_SLOT_LABEL : slot}</div>
      {columns.map((day) => (
        <div key={day} className={cellClass(day === today)}>
          {(days.get(day)?.slots[slot] ?? []).map((visit) => (
            <VisitChip key={visit.visitId} visit={visit} onOpen={onOpenVisit} />
          ))}
        </div>
      ))}
    </>
  )
}

/**
 * Lưới tuần: cột giờ + 7 cột ngày (T2…CN); hàng là 4 khung cố định và hàng "Giờ khác" khi có lượt giờ lạ. Mỗi ô liệt kê
 * MỌI lượt của khung (không cắt bớt). Tiêu đề cột là nút mở Drawer của ngày. Màn hình hẹp chuyển thành danh sách dọc.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F03
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F08
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F17
 * @param {string} anchor
 * @param {Map<string, object>} days   Kết quả `groupByDay`
 * @param {string} today
 * @param {boolean} narrow
 * @param {(dayKey: string) => void} onOpenDay
 * @param {(visit: object) => void} onOpenVisit
 */
export default function WeekGrid({ anchor, days, today, narrow, onOpenDay, onOpenVisit }) {
  if (narrow) return <WeekList anchor={anchor} days={days} today={today} onOpenVisit={onOpenVisit} />

  const columns = weekDays(anchor)
  const hasOther = columns.some((day) => (days.get(day)?.slots[OTHER_SLOT] ?? []).length > 0)
  const rows = [...SLOT_TIMES, ...(hasOther ? [OTHER_SLOT] : [])]

  return (
    <div className={grid.weekWrap} role="group" aria-label="Lịch tuần">
      <div className={grid.week}>
        <div className={`${grid.cell} ${grid.cellHead}`} />
        {columns.map((day) => (
          <div key={day} className={`${cellClass(day === today)} ${grid.cellHead}`}>
            <button
              type="button"
              className={grid.dayHead}
              onClick={() => onOpenDay(day)}
              aria-label={`Mở ${dayLabel(day)}${day === today ? ', hôm nay' : ''}`}
            >
              <span>{weekdayLabel(day)} {shortDate(day)}</span>
              {day === today && <span className={grid.todayTag}>Hôm nay</span>}
            </button>
          </div>
        ))}
        {rows.map((slot) => (
          <WeekRow key={slot} slot={slot} columns={columns} days={days} today={today} onOpenVisit={onOpenVisit} />
        ))}
      </div>
    </div>
  )
}
