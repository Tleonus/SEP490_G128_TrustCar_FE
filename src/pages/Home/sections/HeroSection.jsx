import { Carousel } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { HERO_SLIDES } from '../../../mock/heroSlides'
import { useBrands } from '../../../hooks/useCatalog'
import SmartCarSearchBox from '../../../components/search/SmartCarSearchBox'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const brands = useBrands()

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
