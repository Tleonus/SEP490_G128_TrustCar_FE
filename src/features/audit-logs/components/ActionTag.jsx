import { actionLabel } from '../utils/auditLabels'
import { actionTone } from '../utils/actionTone'
import styles from '../styles/AuditLogs.module.css'

/**
 * KAN-92: thẻ màu cho nhóm hành động. Có chấm tròn + chữ để không chỉ dựa vào màu sắc.
 * @param {{ action?: string|null }} props
 */
export default function ActionTag({ action }) {
  if (action === null || action === undefined || action === '') return <span className={styles.badgeEmpty}>—</span>
  const tone = actionTone(action)
  return (
    <span className={styles.badge} style={{ background: tone.bg, color: tone.fg }}>
      <span className={styles.badgeDot} style={{ background: tone.dot }} aria-hidden="true" />
      {actionLabel(action)}
    </span>
  )
}
