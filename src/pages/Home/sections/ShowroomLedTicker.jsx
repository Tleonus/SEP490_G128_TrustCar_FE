import {
  ThunderboltFilled,
  CheckCircleFilled,
  CarFilled,
  StarFilled,
} from '@ant-design/icons'
import styles from './ShowroomLedTicker.module.css'

const LED_ITEMS = [
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
  const marqueeList = [...LED_ITEMS, ...LED_ITEMS]

  return (
    <div className={styles.ledBar} role="region" aria-label="Bảng điện tử LED Showroom TrustCar">
      {/* Dải đèn LED chạy viền trên & viền dưới */}
      <div className={styles.ledStripTop} aria-hidden="true" />
      <div className={styles.hologramGrid} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Huy hiệu trạng thái LED Hologram bên trái */}
        <div className={styles.statusBadge}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <span className={styles.statusText}>TrustCar xe chất</span>
        </div>

        {/* Dòng chữ LED chạy vô tận */}
        <div className={styles.marqueeViewport}>
          <div className={styles.marqueeTrack}>
            {marqueeList.map((item, idx) => (
              <div key={`${item.tag}-${idx}`} className={styles.tickerItem}>
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
