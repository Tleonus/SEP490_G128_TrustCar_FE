/**
 * KAN-56 – Drawer xem chi tiết một xe trong hàng chờ duyệt.
 *
 * Dữ liệu thật từ GET /manage/cars/:id: ảnh, ODO (mileage), thông số, giá.
 * 5 tiêu chí CPO và ảnh bằng chứng nằm trong biên bản kiểm định; Backend hiện
 * không có API lấy biên bản theo carId (GET /inspections/:id đòi đúng id biên bản,
 * mà xe không lưu id đó), nên Drawer nói rõ phần này chưa xem được thay vì bịa dữ liệu.
 */

import { useEffect, useState } from 'react'
import { Alert, Descriptions, Drawer, Image, Tag } from 'antd'
import { getCarDetail } from '../api/approvalApi'
import { approvalErrorMessage } from '../utils/approvalErrors'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import { getCarTitle, sortCarImages } from '../../../utils/car'
import { formatDate, formatMileage, formatPrice } from '../../../utils/format'
import { CAR_STATUS_META } from '../../inspection/constants/inspectionConstants'
import styles from '../styles/ApprovalPage.module.css'

const TRANSMISSION_LABEL = { MANUAL: 'Số sàn', AUTOMATIC: 'Số tự động', CVT: 'Vô cấp', DCT: 'Ly hợp kép' }
const FUEL_LABEL = { GASOLINE: 'Xăng', DIESEL: 'Dầu', HYBRID: 'Hybrid', ELECTRIC: 'Điện', LPG: 'Gas' }

export default function ApprovalCarDrawer({ carId, open, onClose, extra }) {
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !carId) return undefined
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    getCarDetail(carId)
      .then((detail) => { if (active) setCar(detail) })
      .catch((err) => { if (active) setError(approvalErrorMessage(err, 'Không tải được chi tiết xe.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, carId])

  const images = sortCarImages(car?.images)
  const statusMeta = CAR_STATUS_META[car?.status] || { label: car?.status || '—', color: 'default' }

  return (
    <Drawer
      title={car ? getCarTitle(car) : 'Chi tiết xe'}
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
      extra={extra}
    >
      {loading && <LoadingState text="Đang tải chi tiết xe..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && car && (
        <div className={styles.drawerBody}>
          <div className={styles.drawerHead}>
            <span className={styles.codeLine}>
              Mã xe <strong>{car.vehicleCode || '—'}</strong>
              {car.licensePlate ? <> · Biển số {car.licensePlate}</> : null}
            </span>
            <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
          </div>

          {images.length > 0 ? (
            <Image.PreviewGroup>
              <div className={styles.photoStrip}>
                {images.map((image) => (
                  <Image
                    key={image._id || image.url}
                    src={image.url}
                    alt={image.caption || getCarTitle(car)}
                    className={styles.photoThumb}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          ) : (
            <div className={styles.noPhoto}>Xe chưa có ảnh trong kho.</div>
          )}

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Năm sản xuất">{car.year || '—'}</Descriptions.Item>
            <Descriptions.Item label="ODO (số km)">{formatMileage(car.mileage)}</Descriptions.Item>
            <Descriptions.Item label="Hộp số">{TRANSMISSION_LABEL[car.transmission] || car.transmission || '—'}</Descriptions.Item>
            <Descriptions.Item label="Nhiên liệu">{FUEL_LABEL[car.fuelType] || car.fuelType || '—'}</Descriptions.Item>
            <Descriptions.Item label="Màu">{car.specifications?.color || '—'}</Descriptions.Item>
            <Descriptions.Item label="Giá niêm yết">{formatPrice(car.price)}</Descriptions.Item>
            <Descriptions.Item label="Mã chứng nhận CPO" span={2}>{car.cpoCertificateId || '—'}</Descriptions.Item>
            <Descriptions.Item label="VIN" span={2}>{car.vin || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày nhập kho">{formatDate(car.listedDate)}</Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">{formatDate(car.updatedAt)}</Descriptions.Item>
          </Descriptions>

          <Alert
            type="info"
            showIcon
            title="Chưa xem được 5 tiêu chí kiểm định"
            description="Biên bản 5 tiêu chí và ảnh bằng chứng nằm trong hồ sơ kiểm định, nhưng Backend hiện chưa có API lấy biên bản theo mã xe (GET /inspections/:id yêu cầu đúng mã biên bản mà xe không lưu). Khi Backend bổ sung, Drawer này sẽ hiển thị thêm phần đó."
          />
        </div>
      )}
    </Drawer>
  )
}
