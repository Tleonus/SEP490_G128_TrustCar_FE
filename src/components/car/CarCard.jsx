import { Link } from 'react-router-dom'
import { CalendarOutlined, DashboardOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { formatPrice, formatMileage } from '../../utils/format'
import { getCarTitle, getCoverImage } from '../../utils/car'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelOf } from '../../utils/constants'
import styles from './CarCard.module.css'

export default function CarCard({ car }) {
  const cover = getCoverImage(car)
  const title = getCarTitle(car)
  const bodyType = car.model?.body_type

  return (
    <Link to={`/xe/${encodeURIComponent(car.stock_code)}`} className={styles.card}>
      <div className={styles.imgWrap}>
        {cover && <img src={cover.image_url} alt={cover.caption || title} className={styles.img} />}
        {bodyType && <span className={styles.badge}>{labelOf(BODY_TYPE_LABEL, bodyType)}</span>}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.price}>{formatPrice(car.listed_price)}</div>
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
