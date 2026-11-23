import { Link } from 'react-router-dom'
import { CloseOutlined } from '@ant-design/icons'
import TestDriveButton from '../../test-drive-booking/components/TestDriveButton'
import { formatPrice } from '../../../utils/format'
import { BODY_TYPE_LABEL } from '../../../utils/constants'
import { buildSpecRows, carPhotos, carTitle } from '../utils/carSpecs'
import PhotoGallery from './PhotoGallery'
import styles from '../panels.module.css'

/**
 * Bảng bên phải khi bấm vào xe: ảnh xe ở trên, rồi tên, giá và thông số có dữ liệu.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F07
 */
export default function CarSpecPanel({ car, onClose }) {
  if (!car) return null
  const rows = buildSpecRows(car)
  return (
    <aside className={styles.panel} aria-label={`Thông số ${carTitle(car)}`}>
      <button type="button" className={styles.panelClose} onClick={onClose}>
        <CloseOutlined /> Đóng
      </button>
      <PhotoGallery key={car.vehicleCode} photos={carPhotos(car)} title={carTitle(car)} />
      <p className={styles.panelEyebrow}>
        {[BODY_TYPE_LABEL[car.bodyType] ?? car.bodyType, car.vehicleCode].filter(Boolean).join(' · ')}
      </p>
      <h2 className={styles.panelTitle}>{carTitle(car)}</h2>
      <p className={styles.price}>{formatPrice(car.price)}</p>
      {car.description && <p className={styles.desc}>{car.description}</p>}
      <dl className={styles.specs}>
        {rows.map((r) => (
          <div key={r.label} className={styles.specRow}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.hint}>Kéo bất kỳ đâu trên xe để xoay xe.</p>
      <div className={styles.panelActions}>
        <Link to={`/xe/${encodeURIComponent(car.vehicleCode)}`} className={styles.secondary}>
          Xem chi tiết
        </Link>
        <div className={styles.bookWrap}>
          <TestDriveButton car={car} />
        </div>
      </div>
    </aside>
  )
}
