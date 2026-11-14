import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb, Button } from 'antd'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import { getCarTitle, getCoverImage } from '../../../utils/car'
import { useCarHoldStatus } from '../hooks/useCarHoldStatus'
import CarDepositPanel from '../components/CarDepositPanel'
import { CarStateBadge } from '../components/DepositStatusBadge'
import { CAR_STATE } from '../constants/depositConstants'
import { formatVnd } from '../utils/depositFormat'
import styles from '../styles/Deposit.module.css'

/**
 * Trang đặt cọc giữ xe: /xe/:carKey/dat-coc
 *
 * Trang này tồn tại vì API công khai /public/cars/:id chỉ trả xe AVAILABLE – khi xe đã
 * RESERVED, trang chi tiết cũ báo "không tìm thấy". Trang này lấy dữ liệu xe từ
 * /deposits/cars/:carKey/hold-status nên luôn hiển thị được trạng thái + đồng hồ đếm ngược.
 */
export default function CarDepositPage() {
  const { carKey } = useParams()
  const navigate = useNavigate()
  const { status, loading, error, refresh } = useCarHoldStatus(carKey)

  if (loading && !status) return <div className="container"><LoadingState text="Đang tải thông tin giữ xe..." /></div>
  if (error && !status) {
    const notFound = error?.response?.status === 404
    return (
      <div className="container">
        <ErrorState
          message={notFound ? 'Không tìm thấy xe hoặc xe đã ngừng bán.' : 'Không thể tải thông tin xe. Vui lòng thử lại.'}
          onRetry={notFound ? undefined : refresh}
        />
      </div>
    )
  }
  if (!status?.car) return null

  const car = status.car
  const title = getCarTitle(car)
  const cover = getCoverImage(car)

  return (
    <div className="container">
      <div className={styles.page}>
        <Breadcrumb
          items={[
            { title: <Link to="/">Trang chủ</Link> },
            { title: <Link to="/xe">Danh sách xe</Link> },
            { title: 'Đặt cọc giữ xe' },
          ]}
        />
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Đặt cọc giữ xe</h1>
          {status.state === CAR_STATE.AVAILABLE && (
            <Button onClick={() => navigate(`/xe/${encodeURIComponent(car.vehicleCode || car._id)}`)}>Xem chi tiết xe</Button>
          )}
        </div>

        <div className={styles.depositLayout}>
          <div className={styles.carCard}>
            {cover?.url ? <img src={cover.url} alt={title} className={styles.carCardImg} /> : <div className={styles.carCardImg} />}
            <div className={styles.carCardBody}>
              <h2 className={styles.carCardTitle}>{title}</h2>
              <div><CarStateBadge state={status.state} /></div>
              <div className={styles.carCardPrice}>{formatVnd(car.price)}</div>
              {car.vehicleCode && <span className={styles.muted}>Mã xe: {car.vehicleCode}</span>}
              {car.year && <span className={styles.muted}>Năm sản xuất: {car.year}</span>}
              {car.mileage != null && <span className={styles.muted}>Số km: {new Intl.NumberFormat('vi-VN').format(car.mileage)} km</span>}
            </div>
          </div>
          <CarDepositPanel carKey={carKey} car={car} />
        </div>
      </div>
    </div>
  )
}
