import { useState, useEffect } from 'react'
import { Button } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getFeaturedCars } from '../../../services/carService'
import CarCard from '../../../components/car/CarCard'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import styles from './FeaturedSection.module.css'

export default function FeaturedSection() {
  const navigate = useNavigate()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getFeaturedCars(8)
      .then((result) => {
        setCars(result.items || result)
        setError(null)
      })
      .catch(() => {
        setError('Không thể tải danh sách xe nổi bật.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <section className={styles.featured}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Xe nổi bật</div>
          <h2 className="section-title">Xe được quan tâm nhiều nhất</h2>
          <p className="section-desc">
            Những chiếc xe được khách hàng yêu thích, đã qua kiểm định
            CPO nghiêm ngặt với 150+ hạng mục.
          </p>
        </div>

        {loading && <LoadingState text="Đang tải danh sách xe..." />}
        {error && <ErrorState message={error} />}
        {!loading && !error && cars.length > 0 && (
          <>
            <div className={styles.grid}>
              {cars.map((car) => (
                <CarCard key={car._id || car.id} car={car} />
              ))}
            </div>
            <div className={styles.actions}>
              <Button
                type="primary"
                size="large"
                icon={<RightOutlined />}
                iconPlacement="end"
                onClick={() => navigate('/xe')}
              >
                Xem tất cả xe
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
