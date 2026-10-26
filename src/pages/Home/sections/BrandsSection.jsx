import { useNavigate } from 'react-router-dom'
import { BRANDS } from '../../../mock/brands'
import styles from './BrandsSection.module.css'

export default function BrandsSection() {
  const navigate = useNavigate()

  function handleBrandClick(brandName) {
    navigate(`/xe?brand=${encodeURIComponent(brandName)}`)
  }

  return (
    <section className={styles.brands}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Thương hiệu nổi bật</div>
          <h2 className="section-title">7 thương hiệu được quan tâm nhiều nhất</h2>
          <p className="section-desc">
            Khám phá hàng trăm chiếc xe từ các thương hiệu hàng đầu,
            đã qua kiểm định chặt chẽ.
          </p>
        </div>
        <div className={styles.grid}>
          {BRANDS.map((brand) => (
            <div
              key={brand.id}
              className={styles.brandCard}
              onClick={() => handleBrandClick(brand.name)}
            >
              <img src={brand.logo} alt={brand.name} className={styles.brandLogo} />
              <div className={styles.brandName}>{brand.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
