import { Link } from 'react-router-dom'
import styles from '../showroom.module.css'

/**
 * Màn che lúc đang dựng showroom, thanh tải mô hình xe, và thông báo lỗi (không để trắng trang).
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F13
 */
export default function LoadingCover({ ready, loading, error }) {
  if (error) {
    return (
      <div className={styles.cover} role="alert">
        <p>{error}</p>
        <Link to="/xe" className={styles.bookLink}>Xem danh sách xe</Link>
      </div>
    )
  }
  if (!ready) {
    return (
      <div className={styles.cover} aria-busy="true">
        <p className={styles.coverBrand}>TRUST CAR</p>
        <p>Đang mở showroom…</p>
      </div>
    )
  }
  if (!loading.busy) return null
  return (
    <div className={styles.loadBar} role="progressbar" aria-label="Đang tải mô hình xe" aria-valuenow={Math.round(loading.progress * 100)}>
      <span style={{ width: `${Math.max(4, loading.progress * 100)}%` }} />
      <em>Đang tải mô hình xe…</em>
    </div>
  )
}
