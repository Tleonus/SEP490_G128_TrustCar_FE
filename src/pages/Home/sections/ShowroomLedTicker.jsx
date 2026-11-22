import {
  ThunderboltFilled,
  CheckCircleFilled,
  CarFilled,
  StarFilled,
  CrownFilled,
} from '@ant-design/icons'
import { useAuthStore } from '../../../store/useAuthStore'
import styles from './ShowroomLedTicker.module.css'

const BASE_LED_ITEMS = [
  {
    icon: <CheckCircleFilled />,
    tag: '3 Cam kết',
    text: 'Không đâm đụng khung gầm · Không thủy kích ngập nước · Không tua ODO',
  },
  {
    icon: <ThunderboltFilled />,
    tag: 'FINANCE 70%',
    text: 'Hỗ trợ trả góp ngân hàng lên tới 70% giá trị xe · Duyệt hồ sơ 24h',
  },
  {
    icon: <CarFilled />,
    tag: 'TEST DRIVE VIP',
    text: 'Trải nghiệm & Đặt lịch lái thử miễn phí trực tiếp tại Showroom TrustCar',
  },
  {
    icon: <StarFilled />,
    tag: 'QR HOLOGRAM CPO',
    text: 'Mỗi xe đều có Chứng nhận CPO điện tử & Mã QR tra cứu lịch sử minh bạch',
  },
]

export default function ShowroomLedTicker() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const userName =
    isAuthenticated && user
      ? (
          user.fullName ||
          user.full_name ||
          user.name ||
          user.username ||
          user.email?.split('@')[0] ||
          ''
        ).trim()
      : ''

  const greetingTarget = userName || 'Quý khách'

  const ledItems = [
    {
      isGreetingBadge: true,
      icon: <CrownFilled />,
      badgeText: `Kính chào ${greetingTarget}`,
      tag: 'WELCOME',
      text: `Kính chào ${greetingTarget} · Chào mừng Quý khách đến với Showroom TrustCar — Chúc Quý khách chọn được mẫu xe ưng ý!`,
    },
    ...BASE_LED_ITEMS,
  ]
  const marqueeList = [...ledItems, ...ledItems]

  return (
    <div className={styles.ledBar} role="region" aria-label="Bảng điện tử LED Showroom TrustCar">
      {/* Dải đèn LED chạy viền trên & viền dưới */}
      <div className={styles.ledStripTop} aria-hidden="true" />
      <div className={styles.hologramGrid} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Toàn bộ dòng chữ và huy hiệu chào mừng đều chạy liên tục từ phải qua trái */}
        <div className={styles.marqueeViewport}>
          <div className={styles.marqueeTrack}>
            {marqueeList.map((item, idx) => (
              <div key={`${item.tag}-${idx}`} className={styles.tickerItem}>
                {item.isGreetingBadge && (
                  <span className={styles.statusBadge}>
                    <span className={styles.pulseDot} aria-hidden="true" />
                    <span className={styles.statusText}>{item.badgeText}</span>
                  </span>
                )}
                <span className={styles.itemIcon}>{item.icon}</span>
                <span className={styles.itemTag}>{item.tag}</span>
                <span className={styles.itemText}>{item.text}</span>
                <span className={styles.separator} aria-hidden="true">
                  ◆
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.ledStripBottom} aria-hidden="true" />
    </div>
  )
}
