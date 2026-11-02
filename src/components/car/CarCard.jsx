import { Link } from 'react-router-dom'
import { CalendarOutlined, DashboardOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { formatPrice, formatMileage } from '../../utils/format'
import { getCarTitle, getCoverImage } from '../../utils/car'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelOf } from '../../utils/constants'
import styles from './CarCard.module.css'

export default function CarCard({ car }) {
  const carId = car.vehicleCode || car._id
  const cover = getCoverImage(car)
  const image = typeof cover === 'string' ? cover : cover?.url
  const title = getCarTitle(car)

  return (
    <Link to={`/xe/${carId}`} className={styles.card}>
      <div className={styles.imgWrap}>
        {image && <img src={image} alt={title} className={styles.img} />}
        {car.bodyType && <span className={styles.badge}>{labelOf(BODY_TYPE_LABEL, car.bodyType)}</span>}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.price}>{formatPrice(car.price)}</div>
        <div className={styles.meta}>
          <span><CalendarOutlined /> {car.year}</span>
          <span><DashboardOutlined /> {formatMileage(car.mileage)}</span>
          <span><ThunderboltOutlined /> {labelOf(FUEL_TYPE_LABEL, car.fuelType)}</span>
        </div>
        <div className={styles.footer}>
          <span>{labelOf(TRANSMISSION_LABEL, car.transmission)}</span>
          <span>{car.vehicleCode}</span>
        </div>
      </div>
    </Link>
  )
}
