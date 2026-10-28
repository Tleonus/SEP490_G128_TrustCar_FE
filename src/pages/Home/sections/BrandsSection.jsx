import { useNavigate } from 'react-router-dom'
import { useBrands } from '../../../hooks/useCatalog'
import styles from './BrandsSection.module.css'

export default function BrandsSection() {
  const navigate = useNavigate()
  const brands = useBrands()

  return (
    <section className={styles.brands}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Thương hiệu nổi bật</div>
          <h2 className="section-title">7 thương hiệu được quan tâm nhiều nhất</h2>
          <p className="section-desc">
            Khám phá hàng trăm chiếc xe từ các thương hiệu hàng đầu, đã qua kiểm định chặt chẽ.
          </p>
        </div>
        <ul className={styles.grid}>
          {brands.map((brand) => (
            <li key={brand.value} className={styles.item}>
              <button
                type="button"
                className={styles.brandCard}
                onClick={() => navigate(`/xe?make=${encodeURIComponent(brand.value)}`)}
                aria-label={`Xem xe ${brand.label}`}
              >
                <span className={styles.logoBox}>
                  {brand.logo && <img src={brand.logo} alt="" className={styles.brandLogo} />}
                </span>
                <span className={styles.brandName}>{brand.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
