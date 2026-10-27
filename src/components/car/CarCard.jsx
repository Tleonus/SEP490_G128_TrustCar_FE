import { Link } from 'react-router-dom'
import { CalendarOutlined, DashboardOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { formatPrice, formatMileage } from '../../utils/format'
import { getCarTitle, getCoverImage } from '../../utils/car'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelOf } from '../../utils/constants'
import styles from './CarCard.module.css'

export default function CarCard({ car }) {
  // Hỗ trợ cả MongoDB (_id) và mock data (id)
  const carId = car._id || car.id
  const image = car.images?.[0]

  return (
    <Link to={`/xe/${carId}`} className={styles.card}>
      <div className={styles.imgWrap}>
        {image && <img src={image} alt={`${car.brand || car.make} ${car.model}`} className={styles.img} />}
        <span className={styles.badge}>{car.bodyType}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>
          {car.brand || car.make} {car.model}
        </h3>
        <div className={styles.price}>{formatPrice(car.price || car.listedPrice)}</div>
        <div className={styles.meta}>
          <span><CalendarOutlined /> {car.manufacturing_year}</span>
          <span><DashboardOutlined /> {formatMileage(car.mileage_km)}</span>
          <span><ThunderboltOutlined /> {labelOf(FUEL_TYPE_LABEL, car.fuel_type)}</span>
        </div>
        <div className={styles.footer}>
          <span>{labelOf(TRANSMISSION_LABEL, car.transmission)}</span>
          <span>{car.stock_code}</span>
        </div>
      </div>
    </Link>
  )
}
