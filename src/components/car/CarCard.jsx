import { Link } from 'react-router-dom'
import { CalendarOutlined, DashboardOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { formatPrice, formatMileage } from '../../utils/format'
import { getCarTitle, getCoverImage } from '../../utils/car'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelOf } from '../../utils/constants'
import styles from './CarCard.module.css'
import CompareCardFrame from '../../features/vehicle-compare/components/CompareCardFrame'

export default function CarCard({ car }) {
  const carId = car.vehicleCode || car.stock_code || car._id || car.id
  const title = getCarTitle(car)
  const image = getCoverImage(car)
  const imageUrl = typeof image === 'string' ? image : image?.image_url || image?.url
  const bodyType = car.bodyType ?? car.model?.body_type
  const fuelType = car.fuelType ?? car.fuel_type

  return (
    <CompareCardFrame car={car}>
      <Link to={`/xe/${encodeURIComponent(carId)}`} className={styles.card}>
        <div className={styles.imgWrap}>
          {imageUrl && <img src={imageUrl} alt={title} className={styles.img} />}
          {bodyType && <span className={styles.badge}>{labelOf(BODY_TYPE_LABEL, bodyType.toUpperCase())}</span>}
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.price}>{formatPrice(car.price ?? car.listed_price ?? car.listedPrice)}</div>
          <div className={styles.meta}>
            <span><CalendarOutlined /> {car.year ?? car.manufacturing_year}</span>
            <span><DashboardOutlined /> {formatMileage(car.mileage ?? car.mileage_km)}</span>
            <span><ThunderboltOutlined /> {labelOf(FUEL_TYPE_LABEL, fuelType?.toUpperCase())}</span>
          </div>
          <div className={styles.footer}>
            <span>{labelOf(TRANSMISSION_LABEL, car.transmission?.toUpperCase())}</span>
            <span>{car.vehicleCode || car.stock_code}</span>
          </div>
        </div>
      </Link>
    </CompareCardFrame>
  )
}
