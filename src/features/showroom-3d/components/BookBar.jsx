import { Link } from 'react-router-dom'
import TestDriveButton from '../../test-drive-booking/components/TestDriveButton'
import styles from '../showroom.module.css'

/**
 * Nút "Đặt lịch lái thử" luôn ở góc phải dưới, cho xe đang chọn (luồng đặt lịch có sẵn).
 * Chưa có xe nào thì dẫn tới danh sách xe.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F10
 */
export default function BookBar({ car }) {
  return (
    <div className={styles.bookBar}>
      {car ? <TestDriveButton car={car} /> : <Link to="/xe" className={styles.bookLink}>Xem xe đang bán</Link>}
    </div>
  )
}
