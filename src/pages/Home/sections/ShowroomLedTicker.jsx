import {
  CheckCircleFilled,
  SafetyCertificateFilled,
  CarFilled,
  ThunderboltFilled,
  CrownFilled,
} from '@ant-design/icons'
import styles from './ShowroomLedTicker.module.css'

const SLOGAN_ITEMS = [
  {
    icon: <CrownFilled />,
    accent: 'TRUSTCAR CPO',
    slogan: 'Xe là phải chất — Minh bạch từng km, rõ ràng từng lịch sử',
  },
  {
    icon: <SafetyCertificateFilled />,
    accent: '150+ HẠNG MỤC',
    slogan: 'Kiểm định chuẩn hãng trước khi lên sàn trưng bày',
  },
  {
    icon: <CheckCircleFilled />,
    accent: '3 CAM KẾT VÀNG',
    slogan: 'Không đâm đụng khung gầm · Không thủy kích · Không tua ODO',
  },
  {
    icon: <ThunderboltFilled />,
    accent: 'TÀI CHÍNH 70%',
    slogan: 'Hỗ trợ trả góp ngân hàng linh hoạt · Duyệt hồ sơ trong 24h',
  },
  {
    icon: <CarFilled />,
    accent: 'LÁI THỬ VIP',
    slogan: 'Trải nghiệm thực tế & kiểm tra xe cùng chuyên viên tại Showroom',
  },
]

export default function ShowroomLedTicker() {
  const trackItems = [...SLOGAN_ITEMS, ...SLOGAN_ITEMS]

  return (
    <div className={styles.ribbon} role="region" aria-label="Thông điệp và cam kết TrustCar">
      <div className={styles.marqueeViewport}>
        <div className={styles.marqueeTrack}>
          {trackItems.map((item, idx) => (
            <div key={`${item.accent}-${idx}`} className={styles.tickerItem}>
              {idx % SLOGAN_ITEMS.length === 0 && (
                <span className={styles.standardBadge}>
                  <span className={styles.liveDot} aria-hidden="true" />
                  <span>TRUSTCAR STANDARD</span>
                </span>
              )}
              <span className={styles.itemIcon} aria-hidden="true">{item.icon}</span>
              <strong className={styles.itemAccent}>{item.accent}</strong>
              <span className={styles.itemSlogan}>{item.slogan}</span>
              <span className={styles.diamond} aria-hidden="true">◆</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
