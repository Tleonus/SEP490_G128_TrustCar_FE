import { Button, Tag } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { ATTENTION_INFO, CAR_STATUS_TEXT, STATUS_COLOR, STATUS_LABEL } from '../constants/testDriveConstants'
import { formatCarName, getStaffActions, groupBySlot, isHoldingSlot } from '../utils/testDriveActions'
import styles from '../styles/TestDriveManagement.module.css'

function CapacityLabel({ held, capacity }) {
  if (!capacity) return null
  const isFull = held >= capacity
  return (
    <span className={isFull ? styles.capacityFull : styles.capacity}>
      {isFull ? 'Đủ chỗ' : 'Giữ'} {held}/{capacity} chỗ
    </span>
  )
}

export default function TestDriveSlotTable({ items, withDate, capacity, actionOptions, busyId, onAction, onOpen }) {
  const groups = groupBySlot(items, { withDate })
  const now = new Date()

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} aria-label="Danh sách lịch lái thử">
        <thead>
          <tr>
            <th scope="col">Mã lịch</th>
            <th scope="col">Khách hàng</th>
            <th scope="col">Xe</th>
            <th scope="col">Nhân viên</th>
            <th scope="col">Trạng thái</th>
            <th scope="col" className={styles.actionsHead}>Thao tác</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr className={styles.groupRow}>
              <th colSpan={6} scope="rowgroup">
                <div className={styles.groupHead}>
                  <span>{group.label}</span>
                  {/* Khung đã qua và không còn ai giữ chỗ thì số chỗ không còn ý nghĩa. */}
                  {(group.key > now.getTime() || group.items.some(isHoldingSlot)) && (
                    <CapacityLabel held={group.items.filter(isHoldingSlot).length} capacity={capacity} />
                  )}
                </div>
              </th>
            </tr>
            {group.items.map((appointment) => {
              const primary = getStaffActions(appointment, { ...actionOptions, now }).find((action) => action.kind === 'primary')
              return (
                <tr key={appointment.id}>
                  <td data-label="Mã lịch" className={styles.code}>{appointment.appointmentCode}</td>
                  <td data-label="Khách hàng">
                    <div className={styles.strong}>{appointment.customer?.fullName || '—'}</div>
                    {appointment.customer?.phone && <a href={`tel:${appointment.customer.phone}`}>{appointment.customer.phone}</a>}
                  </td>
                  <td data-label="Xe">
                    <div>{formatCarName(appointment.car) || '—'}</div>
                    <div className={styles.muted}>{CAR_STATUS_TEXT[appointment.car?.status] ?? ''}</div>
                  </td>
                  <td data-label="Nhân viên">{appointment.assignedTo?.fullName || 'Chưa phân công'}</td>
                  <td data-label="Trạng thái">
                    <Tag color={STATUS_COLOR[appointment.status]}>{STATUS_LABEL[appointment.status] ?? appointment.status}</Tag>
                    {appointment.attentionReasons?.map((reason) => (
                      <div key={reason} className={styles.attention}>
                        <WarningOutlined aria-hidden="true" />{ATTENTION_INFO[reason]?.label ?? reason}
                      </div>
                    ))}
                  </td>
                  <td data-label="Thao tác">
                    <div className={styles.rowActions}>
                      {primary && (
                        <Button type="primary" size="large" loading={busyId === appointment.id} onClick={() => onAction(primary.key, appointment)}>
                          {primary.label}
                        </Button>
                      )}
                      <Button size="large" aria-label={`Xem chi tiết ${appointment.appointmentCode}`} onClick={() => onOpen(appointment.id)}>
                        Chi tiết
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        ))}
      </table>
    </div>
  )
}
