import { ExclamationCircleFilled } from '@ant-design/icons'
import { heldMessage } from '../utils/heldCars'
import styles from '../styles/HeldCarNotice.module.css'

/**
 * Báo ngay khi mở hộp đặt lịch rằng một xe đang chọn đã có lượt chưa diễn ra của chính khách
 * (BE không cho giữ cùng một xe ở hai lượt). Gọn một dòng, kèm hai lối đi nhỏ: xem lượt cũ hoặc chọn xe khác.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F05
 * @param {{ cars: { id: string, title: string }[], onGo: (path: string) => void }} props
 */
export default function HeldCarNotice({ cars, onGo }) {
  return (
    <div className={styles.box} role="alert">
      <ExclamationCircleFilled className={styles.icon} aria-hidden />
      <div className={styles.body}>
        <p className={styles.title}>{heldMessage(cars)}</p>
        <p className={styles.text}>Mỗi xe chỉ giữ được một lượt. Chọn xe khác hoặc hủy lượt cũ để đặt lại.</p>
        <div className={styles.links}>
          <button type="button" className={styles.link} onClick={() => onGo('/lich-hen')}>Xem lịch hẹn của tôi</button>
          <span className={styles.dot} aria-hidden>·</span>
          <button type="button" className={styles.link} onClick={() => onGo('/xe')}>Xem xe khác</button>
        </div>
      </div>
    </div>
  )
}
