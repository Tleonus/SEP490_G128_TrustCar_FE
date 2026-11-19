import { Carousel } from 'antd'
import { CrownFilled, SafetyCertificateOutlined } from '@ant-design/icons'
import { HERO_SLIDES } from '../../../mock/heroSlides'
import { useBrands } from '../../../hooks/useCatalog'
import { useAuthStore } from '../../../store/useAuthStore'
import SmartCarSearchBox from '../../../components/search/SmartCarSearchBox'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const brands = useBrands()
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

  return (
    <section className={styles.hero}>
      <Carousel autoplay autoplaySpeed={5000} effect="fade" className={styles.carousel}>
        {HERO_SLIDES.map((slide, idx) => (
          <div key={slide.id}>
            <div className={styles.slide}>
              <img
                src={slide.image}
                alt=""
                className={styles.slideImg}
                fetchPriority={idx === 0 ? 'high' : 'low'}
              />
              <div className={styles.overlay}></div>
              <div className={styles.content}>
                <div className="container">
                  <div className={styles.textBlock}>
                    <div className={styles.welcomeBar}>
                      <span className={styles.welcomeIcon} aria-hidden="true">
                        <CrownFilled />
                      </span>
                      <div className={styles.welcomeCopy}>
                        <span className={styles.welcomeText}>
                          Kính chào <strong className={styles.welcomeName}>{greetingTarget}</strong>
                        </span>
                        <span className={styles.welcomeDivider} aria-hidden="true">
                          •
                        </span>
                        <span className={styles.welcomeSub}>Chào mừng Quý khách</span>
                      </div>
                    </div>

                    <div className={styles.eyebrow}>
                      <SafetyCertificateOutlined />
                      <span>Kiểm định chuyên nghiệp</span>
                    </div>
                    {idx === 0 ? (
                      <h1 className={styles.title}>{slide.title}</h1>
                    ) : (
                      <h2 className={styles.title}>{slide.title}</h2>
                    )}
                    <p className={styles.subtitle}>{slide.subtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      <div className={styles.searchLayer}>
        <div className="container">
          <SmartCarSearchBox variant="hero" brands={brands} />
        </div>
      </div>
    </section>
  )
}
