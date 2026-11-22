import { VISIT_STATUS } from '../../test-drive-booking/constants/testDriveConstants'
import { badgesOf, visitLine } from '../utils/groupVisits'
import styles from '../styles/StaffCalendar.module.css'

/**
 * Một lượt rút gọn trên lịch: giờ · tên khách · số xe, kèm NHÃN CHỮ trạng thái (màu chỉ là phụ) và, khi `showBadges`,
 * các nhãn nhắc việc. Là `<button>` để dùng được bằng bàn phím.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F06
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F18
 * @param {object} visit
 * @param {(visit: object) => void} onOpen
 * @param {boolean} [showBadges]
 */
export default function VisitChip({ visit, onOpen, showBadges = false }) {
  const statusLabel = VISIT_STATUS[visit.status]?.label ?? visit.status
  const tone = styles[`s_${visit.status}`] ?? styles.s_CANCELLED
  const badges = showBadges ? badgesOf(visit) : []

  return (
    <button
      type="button"
      className={`${styles.chip} ${tone}`}
      onClick={() => onOpen(visit)}
      aria-label={`${visit.visitCode}: ${visitLine(visit)}, ${statusLabel}`}
    >
      <span className={styles.chipLine}>{visitLine(visit)}</span>
      <span className={styles.chipStatus}>{statusLabel}</span>
      {badges.length > 0 && (
        <span className={styles.badges}>
          {badges.map((badge) => <span key={badge.key} className={styles.badge}>{badge.label}</span>)}
        </span>
      )}
    </button>
  )
}
