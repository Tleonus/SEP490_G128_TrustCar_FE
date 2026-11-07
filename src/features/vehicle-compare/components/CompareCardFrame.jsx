import CompareToggle from './CompareToggle'
import SaveCarButton from '../../saved-cars/components/SaveCarButton'
import styles from './CompareCardFrame.module.css'

/**
 * Khung bao thẻ xe: đặt nút "Lưu xe" và "So sánh" ở góc trên phải ảnh, là anh em của thẻ
 * (không lồng nút trong liên kết, nên bấm nút không mở trang chi tiết).
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F06
 */
export default function CompareCardFrame({ car, children }) {
  return (
    <div className={styles.frame}>
      {children}
      <div className={styles.slot}>
        <SaveCarButton car={car} variant="card" />
        <CompareToggle car={car} variant="card" />
      </div>
    </div>
  )
}
