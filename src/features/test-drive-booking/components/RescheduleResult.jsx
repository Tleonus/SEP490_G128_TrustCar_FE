import { CheckCircleFilled } from '@ant-design/icons'
import VisitStatusTag from './VisitStatusTag'
import { formatVnDateTime } from '../utils/vnTime'
import styles from '../styles/BookingModal.module.css'

const carTitle = (car) => [car.make, car.model, car.variant].filter(Boolean).join(' ') || car.vehicleCode || 'Xe'

/**
 * Màn kết quả sau khi đổi lịch thành công (200): mã lượt MỚI, "thay cho mã <cũ>", giờ mới (VN), trạng thái.
 * Khách: nhắc showroom sẽ gọi xác nhận lại. Nhân viên: lượt giữ nguyên trạng thái. Không hứa gì về email (REQ-F38).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F28
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F38
 * @param {{ visit: object, previousVisitCode: string }} result
 * @param {'customer'|'staff'} audience
 */
export default function RescheduleResult({ result, audience }) {
  const { visit, previousVisitCode } = result
  return (
    <div className={styles.success} role="status">
      <p className={styles.code}>
        <CheckCircleFilled style={{ color: 'var(--color-success)', marginRight: 8 }} />
        Đã đổi lịch: mã mới {visit.visitCode}
      </p>
      {previousVisitCode && <p className={styles.notice}>Thay cho mã {previousVisitCode}</p>}

      <dl className={styles.summary}>
        <div>
          <dt>Thời gian mới (giờ Việt Nam)</dt>
          <dd>{formatVnDateTime(visit.scheduledAt)}</dd>
        </div>
        <div>
          <dt>Trạng thái</dt>
          <dd><VisitStatusTag status={visit.status} /></dd>
        </div>
        <div>
          <dt>Xe lái thử</dt>
          <dd>
            <ul className={styles.carList}>
              {visit.appointments.map((item) => <li key={item._id}>{carTitle(item.car)}</li>)}
            </ul>
          </dd>
        </div>
      </dl>

      {audience === 'customer' && (
        <p className={styles.notice}>Showroom sẽ gọi điện để xác nhận lại lịch mới của bạn.</p>
      )}
    </div>
  )
}
