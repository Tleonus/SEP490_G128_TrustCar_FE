import { OTHER_SLOT, OTHER_SLOT_LABEL, SLOT_TIMES } from '../constants/calendarConstants'
import VisitChip from './VisitChip'
import styles from '../styles/StaffCalendar.module.css'

function SlotBlock({ title, visits, showEmpty, onOpenVisit }) {
  if (visits.length === 0 && !showEmpty) return null
  return (
    <section className={styles.slotBlock} aria-label={`Khung ${title}`}>
      <h4 className={styles.slotTitle}>{title}</h4>
      {visits.length === 0
        ? <p className={styles.slotEmpty}>Chưa có lượt</p>
        : visits.map((visit) => <VisitChip key={visit.visitId} visit={visit} onOpen={onOpenVisit} showBadges />)}
    </section>
  )
}

/**
 * Các lượt của MỘT ngày, nhóm theo khung giờ (08:00, 10:00, 13:00, 15:00) rồi khối "Giờ khác" cho lượt có giờ lạ.
 * `showEmpty`: hiện cả khung chưa có lượt ("Chưa có lượt"); tắt thì chỉ liệt kê khung có lượt.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F09
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F23
 * @param {{ slots: Record<string, object[]> }|undefined} entry  Mục của ngày trong `groupByDay`
 * @param {(visit: object) => void} onOpenVisit
 * @param {boolean} [showEmpty]
 */
export default function DayAgenda({ entry, onOpenVisit, showEmpty = true }) {
  return (
    <div className={styles.agenda}>
      {SLOT_TIMES.map((time) => (
        <SlotBlock key={time} title={time} visits={entry?.slots[time] ?? []} showEmpty={showEmpty} onOpenVisit={onOpenVisit} />
      ))}
      <SlotBlock title={OTHER_SLOT_LABEL} visits={entry?.slots[OTHER_SLOT] ?? []} showEmpty={false} onOpenVisit={onOpenVisit} />
    </div>
  )
}
