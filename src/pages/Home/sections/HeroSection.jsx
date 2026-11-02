import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carousel, Select, Input, Button, ConfigProvider, theme } from 'antd'
import { SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { HERO_SLIDES } from '../../../mock/heroSlides'
import { useBrands } from '../../../hooks/useCatalog'
import { PRICE_RANGES } from '../../../utils/constants'
import styles from './HeroSection.module.css'

// Thanh tìm kiếm luôn nền sáng (kể cả dark mode) để nổi trên ảnh
const SEARCH_THEME = { algorithm: theme.defaultAlgorithm }

// Dropdown mở lên trên để không tràn khỏi banner xuống section bên dưới
const DROPDOWN_PROPS = { placement: 'topLeft', listHeight: 240 }

export default function HeroSection() {
  const navigate = useNavigate()
  const brands = useBrands()
  const [keyword, setKeyword] = useState('')
  const [make, setMake] = useState()
  const [priceRange, setPriceRange] = useState()

  function handleSearch(event) {
    event?.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (make) params.set('make', make)
    const range = PRICE_RANGES[priceRange]
    if (range?.min) params.set('priceMin', range.min)
    if (range?.max) params.set('priceMax', range.max)
    navigate(`/xe?${params.toString()}`)
  }

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
          <ConfigProvider theme={SEARCH_THEME}>
            <form className={styles.searchBox} onSubmit={handleSearch} role="search" aria-label="Tìm xe">
              <Input
                placeholder="Tìm theo tên xe..."
                prefix={<SearchOutlined className={styles.inputIcon} />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                size="large"
                aria-label="Tên xe"
                className={styles.keyword}
                allowClear
              />
              <Select
                {...DROPDOWN_PROPS}
                placeholder="Thương hiệu"
                value={make}
                onChange={setMake}
                options={brands.map((b) => ({ value: b.value, label: b.label }))}
                size="large"
                aria-label="Thương hiệu"
                allowClear
              />
              <Select
                {...DROPDOWN_PROPS}
                placeholder="Khoảng giá"
                value={priceRange}
                onChange={setPriceRange}
                options={PRICE_RANGES.map((r, i) => ({ value: i, label: r.label }))}
                size="large"
                aria-label="Khoảng giá"
                allowClear
              />
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className={styles.searchBtn}
              >
                Tìm xe
              </Button>
            </form>
          </ConfigProvider>
        </div>
      </div>
    </section>
  )
}
