import { SwapOutlined } from '@ant-design/icons'
import { carTitle } from '../utils/carSpecs'
import styles from '../showroom.module.css'

/**
 * Xe đang trên bục studio (bấm tên để xem ảnh / thông số) và nút "Đổi xe" chọn xe khác ngay trong studio.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F09
 */
export default function StudioCarBar({ car, onPick, onOpen }) {
  return (
    <div className={styles.shelves}>
      <div className={styles.shelf}>
        <span className={styles.shelfLabel}>Trên bục</span>
        <button type="button" className={styles.carLink} onClick={() => onOpen(car)}>
          {carTitle(car)}
        </button>
        <button type="button" className={styles.swap} onClick={onPick}>
          <SwapOutlined /> Đổi xe
        </button>
      </div>
    </div>
  )
}
