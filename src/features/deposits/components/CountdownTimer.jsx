import { ClockCircleOutlined } from '@ant-design/icons'
import { useCountdown } from '../hooks/useCountdown'
import { pad2, splitDuration } from '../utils/depositFormat'
import styles from '../styles/Deposit.module.css'

/**
 * Đồng hồ đếm ngược thời gian giữ xe. expiresAt luôn lấy từ backend.
 * Khi hết giờ gọi onExpire để tải lại trạng thái thật (không tự đổi giao diện theo giờ máy).
 */
export default function CountdownTimer({ expiresAt, clockOffsetMs = 0, onExpire, label = 'Thời gian giữ xe còn lại', compact = false }) {
  const remaining = useCountdown(expiresAt, { clockOffsetMs, onExpire })
  if (remaining == null) return null

  const { hours, minutes, seconds } = splitDuration(remaining)
  const urgent = remaining > 0 && remaining < 60 * 60 * 1000
  const done = remaining === 0

  if (compact) {
    return (
      <span className={`${styles.countdownCompact} ${urgent ? styles.urgent : ''}`} role="timer" aria-live="off">
        <ClockCircleOutlined /> {done ? 'Đang cập nhật…' : `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`}
      </span>
    )
  }

  return (
    <div className={`${styles.countdown} ${urgent ? styles.urgent : ''}`} role="timer" aria-label={label}>
      <span className={styles.countdownLabel}><ClockCircleOutlined /> {label}</span>
      {done ? (
        <span className={styles.countdownDone}>Đã hết thời gian giữ xe – đang cập nhật trạng thái…</span>
      ) : (
        <div className={styles.countdownDigits}>
          <span className={styles.digitBox}><strong>{pad2(hours)}</strong><small>giờ</small></span>
          <span className={styles.digitSep}>:</span>
          <span className={styles.digitBox}><strong>{pad2(minutes)}</strong><small>phút</small></span>
          <span className={styles.digitSep}>:</span>
          <span className={styles.digitBox}><strong>{pad2(seconds)}</strong><small>giây</small></span>
        </div>
      )}
    </div>
  )
}
