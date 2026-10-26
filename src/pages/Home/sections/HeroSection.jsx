import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carousel, Select, Input, Button } from 'antd'
import { SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { HERO_SLIDES } from '../../../mock/heroSlides'
import { BRANDS } from '../../../mock/brands'
import { PRICE_RANGES } from '../../../utils/constants'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [brand, setBrand] = useState('')
  const [priceRange, setPriceRange] = useState('')

  function handleSearch() {
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (brand) params.set('brand', brand)
    if (priceRange) {
      const range = PRICE_RANGES[priceRange]
      if (range) {
        params.set('priceFrom', range.min)
        if (range.max) params.set('priceTo', range.max)
      }
    }
    navigate(`/xe?${params.toString()}`)
  }

  return (
    <section className={styles.hero}>
      <Carousel autoplay autoplaySpeed={5000} effect="fade" dots={{ className: 'hero-dots' }}>
        {HERO_SLIDES.map((slide) => (
          <div key={slide.id} className={styles.slide}>
            <img src={slide.image} alt={slide.title} className={styles.slideImg} />
            <div className={styles.overlay}></div>
            <div className={styles.content}>
              <div className={styles.contentInner}>
                <div className={styles.textBlock}>
                  <div className={styles.eyebrow}>
                    <SafetyCertificateOutlined />
                    <span>Kiểm định chuyên nghiệp</span>
                  </div>
                  <h1 className={styles.title}>{slide.title}</h1>
                  <p className={styles.subtitle}>{slide.subtitle}</p>

                  {slide.id === 1 && (
                    <div className={styles.searchBox}>
                      <Input
                        placeholder="Tìm theo tên xe..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onPressEnter={handleSearch}
                        size="large"
                        style={{ height: 44 }}
                      />
                      <Select
                        placeholder="Thương hiệu"
                        value={brand || undefined}
                        onChange={setBrand}
                        size="large"
                        style={{ height: 44 }}
                        allowClear
                      >
                        {BRANDS.map((b) => (
                          <Select.Option key={b.id} value={b.name}>
                            {b.name}
                          </Select.Option>
                        ))}
                      </Select>
                      <Select
                        placeholder="Khoảng giá"
                        value={priceRange || undefined}
                        onChange={setPriceRange}
                        size="large"
                        style={{ height: 44 }}
                        allowClear
                      >
                        {PRICE_RANGES.map((range, idx) => (
                          <Select.Option key={idx} value={String(idx)}>
                            {range.label}
                          </Select.Option>
                        ))}
                      </Select>
                      <Button
                        type="primary"
                        size="large"
                        icon={<SearchOutlined />}
                        onClick={handleSearch}
                        className={styles.searchBtn}
                      >
                        Tìm xe
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </section>
  )
}
