import { WarningFilled } from '@ant-design/icons'
import { AI_DISCLAIMER_TITLE, AI_DISCLAIMER_COMPARE } from '../../constants/aiDisclaimer'
import styles from './AiDisclaimer.module.css'

/**
 * Component cảnh báo AI chuẩn hóa dùng chung toàn website (KAN-77).
 *
 * @param {object} props
 * @param {'banner' | 'strip' | 'chat'} [props.variant='strip']
 * @param {'light' | 'dark'} [props.surface='light'] - Nền nơi đặt strip/banner
 * @param {string} [props.title] - Tiêu đề (dùng cho variant="banner")
 * @param {string} [props.text] - Nội dung cảnh báo
 * @param {string} [props.className]
 */
export default function AiDisclaimer({
  variant = 'strip',
  surface = 'light',
  title = AI_DISCLAIMER_TITLE,
  text = AI_DISCLAIMER_COMPARE,
  className = '',
}) {
  if (variant === 'banner') {
    return (
      <div
        className={`${styles.banner} ${surface === 'light' ? styles.bannerLight : ''} ${className}`}
        role="alert"
      >
        <div className={styles.bannerIconWrap} aria-hidden="true">
          <WarningFilled />
        </div>
        <div className={styles.bannerBody}>
          <div className={styles.bannerTitle}>{title}</div>
          <p className={styles.bannerText}>{text}</p>
        </div>
      </div>
    )
  }

  if (variant === 'chat') {
    return (
      <div className={`${styles.chatBar} ${className}`} role="note">
        <WarningFilled className={styles.chatIcon} aria-hidden="true" />
        <span className={styles.chatText}>{text}</span>
      </div>
    )
  }

  return (
    <div
      className={`${styles.strip} ${surface === 'dark' ? styles.stripDark : styles.stripLight} ${className}`}
      role="note"
    >
      <WarningFilled className={styles.stripIcon} aria-hidden="true" />
      <span className={styles.stripText}>
        <strong>Lưu ý AI:</strong> {text}
      </span>
    </div>
  )
}
