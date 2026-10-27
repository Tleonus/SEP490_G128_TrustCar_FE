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
            <li key={brand.brand_id} className={styles.item}>
              <button
                type="button"
                className={styles.brandCard}
                onClick={() => navigate(`/xe?brand_id=${encodeURIComponent(brand.brand_id)}`)}
                aria-label={`Xem xe ${brand.brand_name}`}
              >
                <span className={styles.logoBox}>
                  <img src={brand.logo} alt="" className={styles.brandLogo} />
                </span>
                <span className={styles.brandName}>{brand.brand_name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
