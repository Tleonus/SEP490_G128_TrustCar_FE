import { Button, Table, Tag } from 'antd'
import VisitStatusTag from './VisitStatusTag'
import { formatVnDateTime } from '../utils/vnTime'
import { hasUnavailableCar, isCarCancelled, isOpenVisit, staffActions } from '../utils/visitRules'
import { rescheduledText } from '../utils/rescheduleRules'
import {
  CAR_STATUS_LABEL, LATE_CANCEL_LABEL, OUTCOME_LABEL, PIN_LABEL, REMINDER_LABEL, STAFF_ACTION_LABEL, STAFF_CANCELLATION_TEXT,
} from '../constants/testDriveConstants'
import styles from '../styles/StaffVisits.module.css'

const carTitle = (car) => [car.make, car.model, car.variant].filter(Boolean).join(' ') || car.vehicleCode || 'Xe'

function CodeCell({ visit }) {
  const moved = rescheduledText(visit)
  return (
    <div className={styles.stacked}>
      <span className={styles.strong}>{visit.visitCode}</span>
      <span><VisitStatusTag status={visit.status} />{visit.isLateCancellation && <Tag color="orange">{LATE_CANCEL_LABEL}</Tag>}</span>
      {(visit.isNewRequest || visit.needsReminderCall || visit.needsOutcome) && (
        <span>
          {visit.isNewRequest && <Tag color="blue">{PIN_LABEL}</Tag>}
          {visit.needsReminderCall && <Tag color="gold">{REMINDER_LABEL}</Tag>}
          {visit.needsOutcome && <Tag color="volcano">{OUTCOME_LABEL}</Tag>}
        </span>
      )}
      {moved && <span className={styles.sub}>{moved}</span>}
      {visit.confirmedBy && <span className={styles.sub}>Xác nhận: {visit.confirmedBy.fullName}</span>}
    </div>
  )
}

/** Màu nền dòng: xe không còn bán (đỏ) > cần chốt kết quả (cam) > cần xử lý/ghim (xanh) > cần gọi nhắc (vàng). Luôn kèm nhãn chữ trong ô mã. */
const rowClass = (visit) => {
  if (hasUnavailableCar(visit)) return styles.alertRow
  if (visit.needsOutcome) return styles.outcomeRow
  if (visit.isNewRequest) return styles.newRow
  if (visit.needsReminderCall) return styles.reminderRow
  return ''
}

function CustomerCell({ visit }) {
  const { customer } = visit
  return (
    <div className={styles.stacked}>
      <span className={styles.strong}>{customer.fullName ?? '(không rõ)'}</span>
      {customer.phone && <a href={`tel:${customer.phone}`}>{customer.phone}</a>}
      {customer.email && <span className={styles.sub}>{customer.email}</span>}
    </div>
  )
}

/** Mỗi xe một dòng: tên + trạng thái hiện tại của xe (đỏ khi không còn bán). */
function CarsCell({ visit }) {
  return (
    <div className={styles.stacked}>
      {visit.appointments.map((item) => {
        const status = item.car.status
        const gone = isCarCancelled(visit, item) || (status && status !== 'AVAILABLE')
        return (
          <span key={item._id} className={styles.carLine}>
            <span className={isCarCancelled(visit, item) ? styles.struck : undefined}>{carTitle(item.car)}</span>
            {status && <Tag color={gone ? 'red' : 'green'}>{CAR_STATUS_LABEL[status] ?? status}</Tag>}
          </span>
        )
      })}
    </div>
  )
}

function NoteCell({ visit }) {
  const cancelled = visit.status === 'CANCELLED' ? STAFF_CANCELLATION_TEXT[visit.cancellationType] : null
  return (
    <div className={styles.stacked}>
      {visit.notes && <span className={styles.sub}>Ghi chú: {visit.notes}</span>}
      {cancelled && <span className={styles.sub}>{cancelled}{visit.cancellationReason ? `: ${visit.cancellationReason}` : ''}</span>}
      {visit.status === 'CANCELLED' && visit.cancellationNote && (
        <span className={styles.sub}>Ghi chú nội bộ: {visit.cancellationNote}</span>
      )}
      {visit.outcome && <span className={styles.sub}>Kết quả: {visit.outcome}</span>}
    </div>
  )
}

/**
 * Bảng lượt cho nhân viên. Nút thao tác chỉ hiện đúng các bước hợp lệ theo bảng chuyển trạng thái (BE vẫn kiểm lại).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F13
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F15
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F30
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F32
 * @param {object[]} items
 * @param {(visit: object, status: string) => void} onAction  `status` là trạng thái đích, hoặc 'RESCHEDULE' (đổi lịch hộ)
 */
export default function StaffVisitTable({ items, onAction }) {
  const columns = [
    { title: 'Mã / trạng thái', key: 'code', width: 140, render: (_, visit) => <CodeCell visit={visit} /> },
    { title: 'Giờ hẹn', key: 'when', width: 120, render: (_, visit) => formatVnDateTime(visit.scheduledAt) },
    { title: 'Khách hàng', key: 'customer', width: 200, render: (_, visit) => <CustomerCell visit={visit} /> },
    { title: 'Xe', key: 'cars', width: 200, render: (_, visit) => <CarsCell visit={visit} /> },
    { title: 'Ghi chú', key: 'note', width: 200, render: (_, visit) => <NoteCell visit={visit} /> },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 240,
      fixed: 'right', // nút luôn thấy được, kể cả khi bảng phải cuộn ngang
      render: (_, visit) => (
        <div className={styles.actions}>
          {isOpenVisit(visit) && (
            <Button size="small" onClick={() => onAction(visit, 'RESCHEDULE')}>{STAFF_ACTION_LABEL.RESCHEDULE}</Button>
          )}
          {staffActions(visit).map((status) => (
            <Button
              key={status}
              size="small"
              type={status === 'CONFIRMED' ? 'primary' : 'default'}
              danger={status === 'CANCELLED'}
              onClick={() => onAction(visit, status)}
            >
              {STAFF_ACTION_LABEL[status]}
            </Button>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className={styles.tableWrap}>
      <Table
        columns={columns}
        dataSource={items}
        rowKey="visitId"
        pagination={false}
        scroll={{ x: 1100 }}
        rowClassName={rowClass}
      />
    </div>
  )
}
