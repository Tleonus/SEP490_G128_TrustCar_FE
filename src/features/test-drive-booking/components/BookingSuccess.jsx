import { CheckCircleFilled } from '@ant-design/icons'
import { formatVnDateTime } from '../utils/vnTime'
import styles from '../styles/BookingModal.module.css'

/**
 * Màn xác nhận sau khi đặt lịch thành công (201).
 * Chỉ hiển thị trường nằm trong hợp đồng BE (lượt phía khách).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F06
 * @param {object} visit  data.visit của BE
 */
export default function BookingSuccess({ visit }) {
  return (
    <div className={styles.success} role="status">
      <p className={styles.code}>
        <CheckCircleFilled style={{ color: 'var(--color-success)', marginRight: 8 }} />
        Đã gửi yêu cầu {visit.visitCode}
      </p>

      <dl className={styles.summary}>
        <div>
          <dt>Thời gian (giờ Việt Nam)</dt>
          <dd>{formatVnDateTime(visit.scheduledAt)}</dd>
        </div>
        <div>
          <dt>Địa điểm</dt>
          <dd>{visit.location ?? 'Showroom TrustCar'}</dd>
        </div>
        <div>
          <dt>Xe lái thử</dt>
          <dd>
            <ul className={styles.carList}>
              {visit.appointments.map((item) => (
                <li key={item._id}>
                  {[item.car.make, item.car.model, item.car.variant].filter(Boolean).join(' ') || item.car.vehicleCode}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <p className={styles.notice}>
        Showroom sẽ gọi điện để xác nhận lịch của bạn. Bạn có thể xem hoặc hủy lượt này trong mục "Lịch hẹn của tôi".
      </p>
    </div>
  )
}
