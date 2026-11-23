import { SwapOutlined } from '@ant-design/icons'
import { carTitle } from '../utils/carSpecs'
import { SHELVES } from '../utils/shelves'
import styles from '../showroom.module.css'

/**
 * Hai kệ ở sảnh: tên xe đang trưng bày (bấm để xem thông số) và nút "Đổi xe" mở bảng chọn xe.
 * Kệ chưa có xe vẫn hiện (chờ mô hình 3D).
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F05
 */
export default function ShelfBar({ shelves, onOpen, onPick }) {
  return (
    <div className={styles.shelves}>
      {SHELVES.map(({ key, label }) => {
        const car = shelves[key]
        return (
          <div key={key} className={styles.shelf}>
            <span className={styles.shelfLabel}>{label}</span>
            {car ? (
              <button type="button" className={styles.carLink} onClick={() => onOpen(car)}>
                {carTitle(car)}
              </button>
            ) : (
              <span className={styles.shelfEmpty}>Trống</span>
            )}
            <button type="button" className={styles.swap} onClick={() => onPick(key)}>
              <SwapOutlined /> {car ? 'Đổi xe' : 'Chọn xe'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
