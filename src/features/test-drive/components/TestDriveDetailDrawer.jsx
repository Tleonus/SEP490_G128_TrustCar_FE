import { Alert, Button, Drawer, Tag } from 'antd'
import { ATTENTION_INFO, CAR_STATUS_TEXT, STATUS_COLOR, STATUS_LABEL } from '../constants/testDriveConstants'
import { formatCarName, getStaffActions } from '../utils/testDriveActions'
import { formatAppointmentWhen } from '../utils/testDriveTime'
import styles from '../styles/TestDriveManagement.module.css'

export default function TestDriveDetailDrawer({ appointment, actionOptions, busyId, onAction, onClose }) {
  if (!appointment) return null
  const actions = getStaffActions(appointment, actionOptions)

  return (
    <Drawer
      open
      size={480}
      title={appointment.appointmentCode}
      onClose={onClose}
      destroyOnHidden
      footer={actions.length > 0 ? (
        <div className={styles.drawerActions}>
          {actions.map((action) => (
            <Button
              key={action.key}
              size="large"
              type={action.kind === 'primary' ? 'primary' : 'default'}
              danger={action.kind === 'danger'}
              loading={action.key === 'confirm' && busyId === appointment.id}
              onClick={() => onAction(action.key, appointment)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    >
      <div className={styles.drawerBody}>
        <div className={styles.muted}>{formatAppointmentWhen(appointment)}</div>
        <div><Tag color={STATUS_COLOR[appointment.status]}>{STATUS_LABEL[appointment.status] ?? appointment.status}</Tag></div>

        {appointment.attentionReasons?.map((reason) => (
          <Alert key={reason} type="warning" showIcon title={ATTENTION_INFO[reason]?.label ?? reason} description={ATTENTION_INFO[reason]?.help} />
        ))}

        <dl className={styles.details}>
          <dt>Khách hàng</dt>
          <dd className={styles.strong}>{appointment.customer?.fullName || '—'}</dd>
          <dt>Điện thoại</dt>
          <dd>{appointment.customer?.phone ? <a href={`tel:${appointment.customer.phone}`}>{appointment.customer.phone}</a> : '—'}</dd>
          <dt>Xe</dt>
          <dd>{appointment.car ? `${formatCarName(appointment.car)} · ${CAR_STATUS_TEXT[appointment.car.status] ?? appointment.car.status}` : '—'}</dd>
          <dt>Nhân viên</dt>
          <dd>{appointment.assignedTo?.fullName || 'Chưa phân công'}</dd>
          <dt>Ghi chú khách</dt>
          <dd>{appointment.notes || 'Không có'}</dd>
        </dl>

        {appointment.outcome && <Alert type="success" title="Kết quả" description={appointment.outcome} />}
        {appointment.cancellationReason && <Alert type="info" title="Lý do hủy (khách thấy nội dung này)" description={appointment.cancellationReason} />}
      </div>
    </Drawer>
  )
}
