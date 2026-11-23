import { Link } from 'react-router-dom'
import logo from '../../../assets/logo-transparent.png'
import styles from '../showroom.module.css'

const REALISM_TEXT = {
  off: 'Ảnh thật: tắt', rendering: 'Đang dựng ảnh thật', done: 'Ảnh thật', waiting: 'Ảnh thật',
}

/**
 * Thương hiệu, nút "Ảnh thật" và nút về trang chủ.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F02
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F11
 */
export default function TopBar({ realism, onToggleRealism }) {
  const on = realism.state !== 'off'
  return (
    <header className={styles.topBar}>
      <Link to="/" className={styles.brand} aria-label="Về trang chủ TRUST CAR">
        <img src={logo} alt="" className={styles.brandLogo} />
        <span>
          <strong>TRUST CAR</strong>
          <small>Showroom 3D</small>
        </span>
      </Link>
      <div className={styles.topActions}>
        <button
          type="button"
          className={styles.realism}
          aria-pressed={on}
          onClick={onToggleRealism}
          title="Đứng yên một chút để ảnh được dựng dần cho mịn như ảnh chụp"
        >
          <span className={realism.state === 'rendering' ? styles.dotBusy : on ? styles.dotOn : styles.dotOff} />
          {REALISM_TEXT[realism.state]}
          {realism.state === 'rendering' && realism.samples > 0 && <em>{realism.samples}</em>}
        </button>
        <Link to="/" className={styles.close}>
          Thoát
        </Link>
      </div>
    </header>
  )
}
