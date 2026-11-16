import { Button, Descriptions, Modal, Tag } from 'antd'
import VisitStatusTag from '../../test-drive-booking/components/VisitStatusTag'
import {
  CAR_STATUS_LABEL, LATE_CANCEL_LABEL, STAFF_ACTION_LABEL, STAFF_CANCELLATION_TEXT,
} from '../../test-drive-booking/constants/testDriveConstants'
import { rescheduledText } from '../../test-drive-booking/utils/rescheduleRules'
import { isCarCancelled, isOpenVisit, staffActions } from '../../test-drive-booking/utils/visitRules'
import { formatVnDateTime } from '../../test-drive-booking/utils/vnTime'
import FeedbackSummary from '../../test-drive-feedback/components/FeedbackSummary'
import { badgesOf } from '../utils/groupVisits'
import styles from '../styles/StaffCalendar.module.css'

const carTitle = (car) => [car?.make, car?.model, car?.variant].filter(Boolean).join(' ') || car?.vehicleCode || 'Xe'

function CarLines({ visit }) {
  return (visit.appointments ?? []).map((item) => {
    const status = item.car?.status
    const cancelled = isCarCancelled(visit, item)
    const gone = cancelled || (status && status !== 'AVAILABLE')
    return (
      <div key={item._id}>
        <span style={cancelled ? { textDecoration: 'line-through' } : undefined}>{carTitle(item.car)}</span>{' '}
        {status && <Tag color={gone ? 'red' : 'green'}>{CAR_STATUS_LABEL[status] ?? status}</Tag>}
      </div>
    )
  })
}

function buildItems(visit) {
  const { customer = {} } = visit
  const cancelled = visit.status === 'CANCELLED' ? STAFF_CANCELLATION_TEXT[visit.cancellationType] : null
  const moved = rescheduledText(visit)
  const badges = badgesOf(visit)

  const items = [
    {
      key: 'status',
      label: 'Trạng thái',
      children: (
        <span>
          <VisitStatusTag status={visit.status} />
          {visit.isLateCancellation && <Tag color="orange">{LATE_CANCEL_LABEL}</Tag>}
          {badges.map((badge) => <Tag key={badge.key}>{badge.label}</Tag>)}
        </span>
      ),
    },
    { key: 'when', label: 'Giờ hẹn', children: formatVnDateTime(visit.scheduledAt) },
    {
      key: 'customer',
      label: 'Khách hàng',
      children: (
        <div>
          <strong>{customer.fullName ?? '(không rõ)'}</strong>
          {customer.phone && <div><a href={`tel:${customer.phone}`}>{customer.phone}</a></div>}
          {customer.email && <div>{customer.email}</div>}
        </div>
      ),
    },
    { key: 'cars', label: 'Xe', children: <CarLines visit={visit} /> },
  ]
  if (visit.notes) items.push({ key: 'notes', label: 'Ghi chú', children: visit.notes })
  if (cancelled) items.push({ key: 'cancel', label: 'Hủy', children: `${cancelled}${visit.cancellationReason ? `: ${visit.cancellationReason}` : ''}` })
  if (visit.status === 'CANCELLED' && visit.cancellationNote) items.push({ key: 'cnote', label: 'Ghi chú nội bộ', children: visit.cancellationNote })
  if (visit.outcome) items.push({ key: 'outcome', label: 'Phản hồi / kết quả', children: <FeedbackSummary outcome={visit.outcome} /> })
  if (moved) items.push({ key: 'moved', label: 'Đổi lịch', children: moved })
  if (visit.confirmedBy) items.push({ key: 'by', label: 'Xác nhận bởi', children: visit.confirmedBy.fullName })
  return items
}

/**
 * Chi tiết một lượt trên lịch, kèm nút thao tác đúng các bước hợp lệ như bảng danh sách (`isOpenVisit` → Đổi lịch,
 * `staffActions` → xác nhận/hủy/hoàn tất/vắng mặt). Không tự gọi API: chỉ báo `onAction(visit, status | 'RESCHEDULE')`.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F10
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F11
 * @param {object|null} visit
 * @param {() => void} onClose
 * @param {(visit: object, status: string) => void} onAction
 */
export default function VisitDetailModal({ visit, onClose, onAction }) {
  if (!visit) return null

  const actions = [
    ...(isOpenVisit(visit) ? ['RESCHEDULE'] : []),
    ...staffActions(visit),
  ]

  return (
    <Modal
      open
      title={`Lượt ${visit.visitCode}`}
      onCancel={onClose}
      width="min(560px, calc(100vw - 32px))"
      footer={(
        <div className={styles.group} style={{ justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Đóng</Button>
          {actions.map((status) => (
            <Button
              key={status}
              type={status === 'CONFIRMED' ? 'primary' : 'default'}
              danger={status === 'CANCELLED'}
              onClick={() => onAction(visit, status)}
            >
              {STAFF_ACTION_LABEL[status]}
            </Button>
          ))}
        </div>
      )}
    >
      <Descriptions column={1} size="small" items={buildItems(visit)} />
    </Modal>
  )
}
