import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightOutlined,
  CrownFilled,
  LeftOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useBrands } from '../../../hooks/useCatalog'
import { useAuthStore } from '../../../store/useAuthStore'
import { useThemeStore } from '../../../store/useThemeStore'
import { getCars } from '../../../services/carService'
import { formatPrice } from '../../../utils/format'
import { getCarTitle } from '../../../utils/car'
import SmartCarSearchBox from '../../../components/search/SmartCarSearchBox'
import HeroCarStage3D from '../components/HeroCarStage3D'
import styles from './HeroSection.module.css'

const HERO_3D_SLIDES = [
  {
    id: 1,
    modelCode: 'TC-2026-0027',
    previewPhoto: '/showroom-3d/cars/TC-2026-0027/1.webp',
    fallbackName: 'Mercedes-Benz C300 AMG',
    fallbackTag: 'Sedan thể thao · Chuẩn CPO',
    title: 'Mua xe cũ, an tâm như xe mới',
    subtitle: 'Mỗi mẫu xe tại TrustCar đều vượt qua quy trình kiểm định 150+ hạng mục và minh bạch hồ sơ lịch sử.',
  },
  {
    id: 2,
    modelCode: 'TC-2026-0028',
    previewPhoto: '/showroom-3d/cars/TC-2026-0028/1.webp',
    fallbackName: 'Mercedes-Benz C250 Exclusive',
    fallbackTag: 'Sedan hạng sang · Đủ hồ sơ',
    title: 'Hàng trăm xe lướt đã qua kiểm định',
    subtitle: 'Trải nghiệm mô hình 3D chân thực, đối chiếu thông số kỹ thuật và giá bán niêm yết rõ ràng.',
  },
  {
    id: 3,
    modelCode: 'TC-2026-0025',
    paintHex: '#0e1013',
    previewPhoto: '/showroom-3d/cars/TC-2026-0025/1.webp',
    fallbackName: 'Xe lướt Đen Obsidian',
    fallbackTag: 'Ngoại thất nguyên bản · CPO',
    title: 'Chọn đúng xe, an tâm mọi hành trình',
    subtitle: 'Hỗ trợ trả góp ngân hàng lên đến 70% giá trị xe, thủ tục nhanh gọn và lái thử ngay tại showroom.',
  },
  {
    id: 4,
    modelCode: 'TC-2026-0001',
    previewPhoto: '/showroom-3d/cars/TC-2026-0001/1.webp',
    fallbackName: 'Xe tuyển chọn TrustCar',
    fallbackTag: 'Cam kết 3 không · Bảo hành chuẩn',
    title: 'Trải nghiệm Showroom ô tô cũ thế hệ mới',
    subtitle: 'Kéo thả xoay 360° trực tiếp hoặc khám phá không gian Showroom 3D toàn màn hình cùng TrustCar.',
  },
]

const AUTO_SLIDE_MS = 8500

export default function HeroSection() {
  const brands = useBrands()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const mode = useThemeStore((state) => state.mode)
  const isDark = mode === 'dark'

  const [activeIdx, setActiveIdx] = useState(0)
  const [catalogMap, setCatalogMap] = useState({})
  const pauseUntilRef = useRef(0)

  // Nạp tên/giá thật từ DB cho 4 mã xe 3D nếu đang có trong kho
  useEffect(() => {
    let alive = true
    getCars({ page: 1, limit: 60 })
      .then((res) => {
        if (!alive || !Array.isArray(res?.items)) return
        const map = {}
        for (const car of res.items) {
          if (car?.vehicleCode) map[car.vehicleCode] = car
        }
        setCatalogMap(map)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Tự chuyển slide xe lướt vào (tạm dừng 14 giây nếu khách vừa kéo xoay mô hình)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return
      setActiveIdx((prev) => (prev + 1) % HERO_3D_SLIDES.length)
    }, AUTO_SLIDE_MS)
    return () => window.clearInterval(timer)
  }, [])

  const slides = useMemo(
    () =>
      HERO_3D_SLIDES.map((item) => {
        const real = catalogMap[item.modelCode]
        return {
          ...item,
          carName: real ? getCarTitle(real) : item.fallbackName,
          carPrice: real?.price ? formatPrice(real.price) : null,
          carCode: real?.vehicleCode || null,
          carYear: real?.year || null,
        }
      }),
    [catalogMap],
  )

  const currentSlide = slides[activeIdx] || slides[0]

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

  const handleSelectSlide = (nextIdx) => {
    pauseUntilRef.current = Date.now() + 14000
    setActiveIdx((nextIdx + slides.length) % slides.length)
  }

  const handleUserInteract = () => {
    pauseUntilRef.current = Date.now() + 16000
  }

  return (
    <section
      className={`${styles.hero} ${isDark ? styles.heroDark : styles.heroLight}`}
      aria-label="Không gian trưng bày xe 3D TrustCar"
    >
      {/* Phông ánh sáng Showroom tự thích ứng Ngày / Đêm */}
      <div className={styles.stageBackdrop} aria-hidden="true">
        <div className={styles.ambientGlowLeft} />
        <div className={styles.ambientGlowRight} />
        <div className={styles.floorHorizon} />
      </div>

      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroGrid}>
          {/* CỘT TRÁI: Chào khách hàng + Nội dung Slide + Hành động chính */}
          <div className={styles.copyColumn}>
            <div className={styles.greetingPill}>
              <span className={styles.greetingIcon} aria-hidden="true">
                <CrownFilled />
              </span>
              <span className={styles.greetingText}>
                Kính chào <strong>{greetingTarget}</strong> · Chào mừng đến với <em>TrustCar</em>
              </span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.eyebrow}>
                <SafetyCertificateOutlined /> Kiểm định CPO 150+ hạng mục
              </span>
            </div>

            <div key={currentSlide.id} className={styles.slideCopyAnimated}>
              <h1 className={styles.title}>{currentSlide.title}</h1>
              <p className={styles.subtitle}>{currentSlide.subtitle}</p>
            </div>

            <div className={styles.ctaRow}>
              <Link to="/xe" className={styles.primaryCta}>
                <span>Khám phá kho xe</span>
                <ArrowRightOutlined />
              </Link>
            </div>

            {/* Điều hướng nhanh các mẫu xe 3D trong slider */}
            <div className={styles.sliderControls}>
              <div className={styles.navButtons}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => handleSelectSlide(activeIdx - 1)}
                  aria-label="Mẫu xe trước"
                >
                  <LeftOutlined />
                </button>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => handleSelectSlide(activeIdx + 1)}
                  aria-label="Mẫu xe tiếp theo"
                >
                  <RightOutlined />
                </button>
              </div>

              <div className={styles.slideDots} role="tablist" aria-label="Chọn mẫu xe trưng bày 3D">
                {slides.map((s, idx) => {
                  const active = idx === activeIdx
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`${styles.slideDot} ${active ? styles.slideDotActive : ''}`}
                      onClick={() => handleSelectSlide(idx)}
                      aria-label={`Xem xe ${s.carName}`}
                    >
                      <span className={styles.slideDotNum}>0{idx + 1}</span>
                    </button>
                  )
                })}
              </div>

              <div className={styles.activeCarMeta}>
                <strong className={styles.activeCarName}>{currentSlide.carName}</strong>
                <span className={styles.activeCarSub}>
                  {currentSlide.carPrice
                    ? `${currentSlide.carPrice}${currentSlide.carYear ? ` · ${currentSlide.carYear}` : ''}`
                    : currentSlide.fallbackTag}
                </span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Sân khấu mô hình xe 3D lướt vào + kéo xoay 360° + đèn pha bật/tắt theo theme */}
          <div className={styles.stageColumn}>
            <div className={styles.stageCard}>
              <div className={styles.stageTopTag}>
                <div className={styles.stageTopLeft}>
                  <span className={styles.stageCode}>{currentSlide.modelCode}</span>
                  {currentSlide.carCode && (
                    <Link
                      to={`/xe/${encodeURIComponent(currentSlide.carCode)}`}
                      className={styles.stageDetailLink}
                    >
                      Hồ sơ xe <ArrowRightOutlined />
                    </Link>
                  )}
                </div>
                <Link
                  to="/showroom-3d"
                  className={styles.miniShowroom3dBtn}
                  title="Mở không gian Showroom 3D toàn màn hình"
                >
                  <span className={styles.mini3dDot}>3D</span>
                  <span>Không gian 3D</span>
                  <ArrowRightOutlined />
                </Link>
              </div>

              <HeroCarStage3D
                slide={currentSlide}
                isDark={isDark}
                onUserInteract={handleUserInteract}
              />
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm xe thông minh đặt gọn bên dưới Hero */}
        <div className={styles.searchDock}>
          <SmartCarSearchBox variant="hero" brands={brands} />
        </div>
      </div>
    </section>
  )
}
