/**
 * KAN-55 – Khối thông tin tổng quan xe trên màn lập biên bản.
 * Tái sử dụng helper sẵn có: getCarTitle/getCoverImage (utils/car) và format* (utils/format).
 */

import { Descriptions, Tag } from 'antd'
import { getCarTitle, getCoverImage } from '../../../utils/car'
import { formatDate, formatMileage, formatPrice } from '../../../utils/format'
import { CAR_STATUS_META } from '../constants/inspectionConstants'
import styles from '../styles/InspectionDetailPage.module.css'

export default function InspectionCarSummary({ car }) {
  if (!car) return null
  const cover = getCoverImage(car)
  const image = typeof cover === 'string' ? cover : cover?.url
  const statusMeta = CAR_STATUS_META[car.status] || { label: car.status, color: 'default' }
  const createdBy = car.createdBy?.fullName || car.createdBy?.email || '—'

  return (
    <section className={styles.summary} aria-labelledby="car-summary-title">
      <div className={styles.summaryMedia}>
        {image
          ? <img src={image} alt={getCarTitle(car)} className={styles.summaryImage} />
          : <div className={styles.summaryImagePlaceholder} aria-hidden="true" />}
      </div>

      <div className={styles.summaryBody}>
        <header className={styles.summaryHead}>
          <div>
            <span className={styles.eyebrow}>HỒ SƠ XE</span>
            <h1 id="car-summary-title" className={styles.summaryTitle}>{getCarTitle(car)}</h1>
            <p className={styles.summaryCode}>
              Mã xe <strong>{car.vehicleCode || '—'}</strong>
              {car.vin ? <> · VIN {car.vin}</> : null}
              {car.licensePlate ? <> · Biển số {car.licensePlate}</> : null}
            </p>
          </div>
          <Tag color={statusMeta.color} className={styles.statusTag}>{statusMeta.label}</Tag>
        </header>

        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2, lg: 3 }}
          className={styles.summaryFacts}
          items={[
            { key: 'year', label: 'Năm sản xuất', children: car.year || '—' },
            { key: 'mileage', label: 'Số km trên hồ sơ', children: formatMileage(car.mileage) },
            { key: 'price', label: 'Giá niêm yết', children: formatPrice(car.price) },
            { key: 'createdBy', label: 'Người tạo hồ sơ', children: createdBy },
            { key: 'listed', label: 'Ngày nhập kho', children: formatDate(car.listedDate) },
            {
              key: 'certificate',
              label: 'Mã CPO',
              children: car.cpoCertificateId || 'Chưa có',
            },
          ]}
        />
      </div>
    </section>
  )
}
