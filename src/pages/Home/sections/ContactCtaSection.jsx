import {
  PhoneOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CompassOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useContactInfo } from '../../../config/contactInfo'
import ScrollReveal from '../components/ScrollReveal'
import showroomImg1 from '../../../assets/Contacts/contact_1.jpg'
import styles from './ContactCtaSection.module.css'

export default function ContactCtaSection() {
  const navigate = useNavigate()
  const contactInfo = useContactInfo()
  const coverSrc = contactInfo.showroomImageUrl || showroomImg1

  return (
    <section className={styles.cta} aria-label="Liên hệ Showroom TrustCar">
      <div className="container">
        <ScrollReveal variant="up" className={styles.banner}>
          <div className={styles.mediaCol}>
            <img
              src={coverSrc}
              alt={contactInfo.showroomName}
              className={styles.thumbImg}
              onError={(e) => {
                if (e.currentTarget.src !== showroomImg1) {
                  e.currentTarget.src = showroomImg1
                }
              }}
            />
            <span className={styles.mediaTag}>SHOWROOM TRUSTCAR</span>
          </div>

          <div className={styles.copyCol}>
            <span className={styles.kicker}>TRẢI NGHIỆM THỰC TẾ</span>
            <h2 className={styles.title}>Ghé showroom xem xe hoặc đặt lịch lái thử</h2>
            <div className={styles.metaList}>
              <span>
                <EnvironmentOutlined /> {contactInfo.showroomAddress}
              </span>
              <span>
                <ClockCircleOutlined /> {contactInfo.showroomHours}
              </span>
            </div>
          </div>

          <div className={styles.actionsCol}>
            <button
              type="button"
              onClick={() => navigate('/lien-he')}
              className={styles.primaryBtn}
            >
              <span>Liên hệ &amp; Đặt lịch</span>
              <ArrowRightOutlined />
            </button>

            <a href={contactInfo.phoneHref} className={styles.secondaryBtn}>
              <PhoneOutlined />
              <span>{contactInfo.phoneDisplay}</span>
            </a>

            <a
              href={contactInfo.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
            >
              <CompassOutlined /> Chỉ đường Google Maps
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
