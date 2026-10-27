import { Link } from 'react-router-dom'
import { CalendarOutlined, DashboardOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { formatPrice, formatMileage } from '../../utils/format'
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
          <span><CalendarOutlined /> {car.year}</span>
          <span><DashboardOutlined /> {formatMileage(car.mileage)}</span>
        </div>
        <div className={styles.footer}>
          <span><EnvironmentOutlined /> {car.location}</span>
          <span>{car.transmission}</span>
        </div>
      </div>
    </Link>
  )
}
