import {
  FacebookFilled,
  MessageFilled,
  PhoneFilled,
  TikTokOutlined,
} from '@ant-design/icons'
import { CONTACT_INFO } from '../../config/contactInfo'
import styles from './FloatingContactWidget.module.css'

function ExternalBubble({ href, label, className, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${styles.channel} ${className}`}
      aria-label={label}
      title={label}
    >
      <span className={styles.channelIcon}>{children}</span>
      <span className={styles.channelLabel}>{label}</span>
    </a>
  )
}

function PhoneBubble() {
  const label = `Gọi ${CONTACT_INFO.phoneDisplay}`

  return (
    <a href={CONTACT_INFO.phoneHref} className={`${styles.channel} ${styles.phoneChannel}`} aria-label={label} title={label}>
      <span className={styles.channelIcon}>
        <PhoneFilled />
      </span>
      <span className={styles.channelLabel}>Gọi hotline</span>
    </a>
  )
}

export default function FloatingContactWidget() {
  return (
    <aside className={styles.root} aria-label="Kênh liên hệ nhanh của TrustCar">
      <div className={styles.list}>
        <ExternalBubble href={CONTACT_INFO.zaloUrl} label="Chat qua Zalo" className={styles.zaloChannel}>
          <span className={styles.zaloWordmark}>Zalo</span>
        </ExternalBubble>
        <ExternalBubble
          href={CONTACT_INFO.messengerUrl}
          label="Nhắn tin qua Messenger"
          className={styles.messengerChannel}
        >
          <MessageFilled />
        </ExternalBubble>
        <ExternalBubble href={CONTACT_INFO.facebookUrl} label="Theo dõi Facebook" className={styles.facebookChannel}>
          <FacebookFilled />
        </ExternalBubble>
        <ExternalBubble href={CONTACT_INFO.tiktokUrl} label="Xem TikTok TrustCar" className={styles.tiktokChannel}>
          <TikTokOutlined />
        </ExternalBubble>
        <PhoneBubble />
      </div>
    </aside>
  )
}
