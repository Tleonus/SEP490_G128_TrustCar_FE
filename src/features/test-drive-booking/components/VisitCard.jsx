import { Button, Tag } from 'antd'
import { Link } from 'react-router-dom'
import VisitStatusTag from './VisitStatusTag'
import { canCancel, isCarCancelled } from '../utils/visitRules'
import { rescheduleHint, rescheduledText } from '../utils/rescheduleRules'
import { formatVnDateTime } from '../utils/vnTime'
import {
  CANCELLATION_TEXT, CAR_UNAVAILABLE_NOTE, LATE_CANCEL_LABEL,
} from '../constants/testDriveConstants'
import styles from '../styles/VisitCard.module.css'

const carTitle = (car) => [car.make, car.model, car.variant].filter(Boolean).join(' ') || car.vehicleCode || 'Xe'

/** Nguyên nhân hủy theo cancellationType; lý do do người dùng nhập chỉ hiện khi có. */
function CancellationNote({ visit }) {
  const text = CANCELLATION_TEXT[visit.cancellationType]
  if (!text) return null
  return (
    <p className={styles.reason}>
      {text}
      {visit.cancellationReason ? `: ${visit.cancellationReason}` : '.'}
    </p>
  )
}

/**
 * Thẻ một lượt lái thử của khách: mã, trạng thái, giờ VN, địa điểm, các xe (xe bị tự hủy gạch ngang),
 * nguyên nhân hủy, nút hủy và nút "Đổi lịch" (hoặc lời giải thích khi không đổi được).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F08
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F09
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F10
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F25
 * @param {object} visit
 * @param {(visit: object) => void} onCancel
 * @param {(visit: object) => void} onReschedule
 */
export default function VisitCard({ visit, onCancel, onReschedule }) {
  const hint = rescheduleHint(visit)
  const movedText = rescheduledText(visit)
  return (
    <article className={styles.card} aria-label={`Lượt lái thử ${visit.visitCode}`}>
      <header className={styles.head}>
        <span className={styles.code}>{visit.visitCode}</span>
        <VisitStatusTag status={visit.status} />
        {visit.isLateCancellation && <Tag color="orange">{LATE_CANCEL_LABEL}</Tag>}
        <span className={styles.when}>{formatVnDateTime(visit.scheduledAt)}</span>
      </header>

      {visit.location && <p className={styles.meta}>{visit.location}</p>}

      <ul className={styles.cars}>
        {visit.appointments.map((item) => {
          const dropped = isCarCancelled(visit, item)
          return (
            <li key={item._id} className={styles.car}>
              {item.car.primaryImageUrl && <img className={styles.thumb} src={item.car.primaryImageUrl} alt="" />}
              <span className={styles.carText}>
                {item.car.vehicleCode ? (
                  <Link to={`/xe/${item.car.vehicleCode}`} className={`${styles.carName} ${dropped ? styles.struck : ''}`}>
                    {carTitle(item.car)}
                  </Link>
                ) : (
                  <span className={`${styles.carName} ${dropped ? styles.struck : ''}`}>{carTitle(item.car)}</span>
                )}
                {dropped && <span className={styles.carNote}>{CAR_UNAVAILABLE_NOTE}</span>}
              </span>
            </li>
          )
        })}
      </ul>

      {visit.notes && <p className={styles.meta}>Ghi chú: {visit.notes}</p>}
      {visit.status === 'CANCELLED' && <CancellationNote visit={visit} />}

      {movedText && <p className={styles.meta}>{movedText}</p>}
      {hint.message && <p className={styles.hint} role="note">{hint.message}</p>}

      {(canCancel(visit) || hint.canReschedule) && (
        <div className={styles.actions}>
          {hint.canReschedule && <Button onClick={() => onReschedule(visit)}>Đổi lịch</Button>}
          {canCancel(visit) && <Button danger onClick={() => onCancel(visit)}>Hủy lượt</Button>}
        </div>
      )}
    </article>
  )
}
