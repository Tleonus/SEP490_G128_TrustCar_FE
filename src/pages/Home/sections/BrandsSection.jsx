import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useBrands } from '../../../hooks/useCatalog'
import ScrollReveal from '../components/ScrollReveal'
import styles from './BrandsSection.module.css'

function formatBrandLabel(label = '') {
  return label
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join('-')
}

export default function BrandsSection() {
  const navigate = useNavigate()
  const brands = useBrands()

  return (
    <section className={styles.brands}>
      <div className="container">
        <ScrollReveal variant="up" className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <span className={styles.kicker}>DANH MỤC HÃNG XE</span>
            <h2 className={styles.heading}>
              Thương hiệu được quan tâm nhiều nhất
              {brands.length > 0 && <span className={styles.countTag}>{brands.length} hãng</span>}
            </h2>
          </div>

          <div className={styles.headerRight}>
            <p className={styles.lead}>
              Chọn nhanh thương hiệu yêu thích để lọc các mẫu xe đã qua kiểm định CPO.
            </p>
            <Link to="/xe" className={styles.allLink}>
              Xem toàn bộ kho xe <ArrowRightOutlined />
            </Link>
          </div>
        </ScrollReveal>

        <ul className={styles.grid}>
          {brands.map((brand, idx) => (
            <ScrollReveal
              key={brand.value}
              as="li"
              variant="up"
              delay={Math.min(idx * 45, 320)}
              className={styles.item}
            >
              <button
                type="button"
                className={styles.brandTile}
                onClick={() => navigate(`/xe?make=${encodeURIComponent(brand.value)}`)}
                aria-label={`Xem xe ${formatBrandLabel(brand.label)}`}
              >
                <span className={styles.logoWrap}>
                  {brand.logo && <img src={brand.logo} alt="" className={styles.brandLogo} />}
                </span>
                <span className={styles.brandMeta}>
                  <span className={styles.brandName}>{formatBrandLabel(brand.label)}</span>
                  <span className={styles.brandHint}>Khám phá mẫu xe</span>
                </span>
                <ArrowRightOutlined className={styles.tileArrow} aria-hidden="true" />
              </button>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
