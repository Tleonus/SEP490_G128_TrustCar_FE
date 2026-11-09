import CompareToggle from './CompareToggle'
import styles from './CompareCardFrame.module.css'

/**
 * Khung bao thẻ xe: đặt nút "So sánh" ở góc trên phải ảnh, là anh em của thẻ
 * (không lồng nút trong liên kết, nên bấm nút không mở trang chi tiết).
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F06
 */
export default function CompareCardFrame({ car, children }) {
  return (
    <div className={styles.frame}>
      {children}
      <div className={styles.slot}>
        <CompareToggle car={car} variant="card" />
      </div>
    </div>
  )
}
