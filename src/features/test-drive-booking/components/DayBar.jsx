import { formatVnDate, weekdayLabel } from '../utils/vnTime'
import styles from '../styles/SlotPicker.module.css'

/** Ghép class name, bỏ giá trị rỗng. */
const cx = (...names) => names.filter(Boolean).join(' ')

/**
 * Thanh chọn ngày (cuộn ngang 14 ngày), dùng chung cho lưới khung của khách và của nhân viên.
 * Mỗi ngày ghi số khung còn trống; ngày kín bị mờ nhưng vẫn chọn được để xem.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F03
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F22
 * @param {object[]} days          Kết quả groupDays
 * @param {string} selectedDate    Khóa YYYY-MM-DD đang chọn
 * @param {(date: string) => void} onSelectDate
 */
export default function DayBar({ days, selectedDate, onSelectDate }) {
  return (
    <div className={styles.days} role="group" aria-label="Chọn ngày">
      {days.map((item) => (
        <button
          key={item.date}
          type="button"
          className={cx(styles.day, item.date === selectedDate && styles.daySelected, item.availableCount === 0 && styles.dayEmpty)}
          aria-pressed={item.date === selectedDate}
          aria-label={`${weekdayLabel(item.date)} ${formatVnDate(`${item.date}T12:00:00+07:00`)}, ${item.availableCount} khung còn trống`}
          onClick={() => onSelectDate(item.date)}
        >
          <span className={styles.weekday}>{item.weekday}</span>
          <span className={styles.date}>{item.short}</span>
          <span className={styles.free}>{item.availableCount > 0 ? `${item.availableCount} trống` : 'Kín'}</span>
        </button>
      ))}
    </div>
  )
}
