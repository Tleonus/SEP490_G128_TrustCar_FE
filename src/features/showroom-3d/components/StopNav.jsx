import { STOPS } from '../three/layout'
import styles from '../showroom.module.css'

/**
 * Cột chỉ số 01–04 bên trái; điểm đang đứng hiện thêm tên. Bấm để tới điểm đó.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F03
 */
export default function StopNav({ stop, onGo }) {
  return (
    <nav className={styles.stopNav} aria-label="Các điểm dừng trong showroom">
      {STOPS.map((s, i) => (
        <button
          key={s.key}
          type="button"
          className={i === stop ? styles.stopActive : styles.stopItem}
          aria-current={i === stop ? 'step' : undefined}
          onClick={() => onGo(i)}
        >
          <span className={styles.stopNum}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.stopLine} />
          <span className={styles.stopLabel}>{s.label}</span>
        </button>
      ))}
    </nav>
  )
}
