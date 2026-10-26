import { Button } from 'antd'
import { PhoneOutlined, MessageOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './ContactCtaSection.module.css'

export default function ContactCtaSection() {
  const navigate = useNavigate()

  return (
    <section className={styles.cta}>
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.textBlock}>
            <h2 className={styles.title}>Cần tư vấn chọn xe phù hợp?</h2>
            <p className={styles.desc}>
              Liên hệ ngay với TrustCar để được hỗ trợ tư vấn miễn phí,
              báo giá nhanh và đặt lịch xem xe tại showroom gần bạn.
            </p>
          </div>
          <div className={styles.actions}>
            <Button type="primary" size="large" icon={<PhoneOutlined />}>
              1900 1234
            </Button>
            <Button
              size="large"
              icon={<MessageOutlined />}
              onClick={() => navigate('/lien-he')}
            >
              Gửi yêu cầu tư vấn
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
