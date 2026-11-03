import { Link } from 'react-router-dom'
import { Tag } from 'antd'
import {
  ArrowRightOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useAdminCars } from '../../hooks/useAdminCars'
import { ADMIN_PATHS } from '../../router/paths'
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateBlock'
import { getCarTitle, getCoverImage } from '../../utils/car'
import { formatDate, formatMileage, formatPrice } from '../../utils/format'
import { CAR_STATUS_COLOR, CAR_STATUS_LABEL, labelOf } from '../../utils/constants'
import styles from './AdminOverviewPage.module.css'

// Keep requests bounded and stable; counts come from pagination metadata.
const ALL_CARS_FILTERS = { page: 1, limit: 1 }
const AVAILABLE_CARS_FILTERS = { page: 1, limit: 1, status: 'AVAILABLE' }
const INCOMING_CARS_FILTERS = { page: 1, limit: 1, status: 'INCOMING' }
const RESERVED_CARS_FILTERS = { page: 1, limit: 1, status: 'RESERVED' }
const RECENT_CARS_FILTERS = { page: 1, limit: 5, sortBy: 'listedDate', sortDir: 'desc' }
const countFormatter = new Intl.NumberFormat('vi-VN')

function MetricCard({ title, description, result, to, linkLabel, icon, tone }) {
  return (
    <article className={`${styles.metricCard} ${styles[tone]}`}>
      <div className={styles.metricHeading}>
        <h2>{title}</h2>
        <span className={styles.metricIcon} aria-hidden="true">{icon}</span>
      </div>
      <div className={styles.metricResult} aria-live="polite" aria-busy={result.loading}>
        {result.loading ? (
          <p className={styles.metricMessage} role="status">Đang tải số lượng…</p>
        ) : result.error ? (
          <div className={styles.metricError}>
            <strong>Không thể tải số lượng</strong>
            <p>{result.error}</p>
          </div>
        ) : (
          <p className={styles.metricValue}>
            {countFormatter.format(result.total)} <span>xe</span>
          </p>
        )}
      </div>
      <p className={styles.metricDescription}>{description}</p>
      <Link to={to} className={styles.metricLink}>
        <span>{linkLabel}</span>
        <ArrowRightOutlined aria-hidden="true" />
      </Link>
    </article>
  )
}

function RecentVehicle({ car }) {
  const title = getCarTitle(car) || 'Xe đang cập nhật thông tin'
  const cover = getCoverImage(car)
  const image = typeof cover === 'string' ? cover : cover?.url

  return (
    <tr className={styles.vehicleRow}>
      <td><div className={styles.vehicleSummary}>
        {image ? (
          <img
            className={styles.vehicleImage}
            src={image}
            alt={title}
            width="88"
            height="64"
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-label="Chưa có ảnh xe" role="img">
            <CarOutlined aria-hidden="true" />
          </div>
        )}
        <div className={styles.vehicleCopy}>
          <span className={styles.vehicleCode}>{car.vehicleCode || 'Chưa có mã xe'}</span>
          <h3>{title}</h3>
          <p>{car.year || 'Chưa có năm sản xuất'} · {formatMileage(car.mileage)}</p>
        </div>
      </div></td>
      <td className={styles.vehiclePrice}>{formatPrice(car.price)}</td>
      <td>
        <Tag color={CAR_STATUS_COLOR[car.status]} className={styles.statusTag}>
          {labelOf(CAR_STATUS_LABEL, car.status)}
        </Tag>
      </td>
      <td>{formatDate(car.listedDate)}</td>
    </tr>
  )
}

export default function AdminOverviewPage() {
  // Each metric resolves independently; one failed request must not hide the others.
  const allCars = useAdminCars(ALL_CARS_FILTERS)
  const availableCars = useAdminCars(AVAILABLE_CARS_FILTERS)
  const incomingCars = useAdminCars(INCOMING_CARS_FILTERS)
  const reservedCars = useAdminCars(RESERVED_CARS_FILTERS)
  const recentCars = useAdminCars(RECENT_CARS_FILTERS)

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <div>
          <h1>Tổng quan</h1>
          <p>Theo dõi tình trạng kho xe và các xe mới nhập tại TrustCar.</p>
        </div>
        <div className={styles.headingActions}>
          <Link to={ADMIN_PATHS.inventory} className={styles.secondaryAction}>
            <CarOutlined aria-hidden="true" />
            Kho xe
          </Link>
          <Link to={ADMIN_PATHS.vehicleIntake} className={styles.primaryAction}>
            <PlusOutlined aria-hidden="true" />
            Nhập xe &amp; thẩm định
          </Link>
        </div>
      </header>

      <section className={styles.metrics} aria-label="Số lượng xe theo trạng thái">
        <MetricCard
          title="Tổng số xe"
          description="Toàn bộ xe, bao gồm mọi trạng thái."
          result={allCars}
          linkLabel="Xem toàn bộ kho xe"
          to={ADMIN_PATHS.inventory}
          icon={<CarOutlined />}
          tone="total"
        />
        <MetricCard
          title={CAR_STATUS_LABEL.AVAILABLE}
          description="Xe đang sẵn sàng để bán."
          result={availableCars}
          linkLabel="Xem xe đang bán"
          to={`${ADMIN_PATHS.inventory}?status=AVAILABLE`}
          icon={<CheckCircleOutlined />}
          tone="available"
        />
        <MetricCard
          title={CAR_STATUS_LABEL.INCOMING}
          description="Xe ở trạng thái mới nhập kho."
          result={incomingCars}
          linkLabel="Xem xe mới nhập"
          to={`${ADMIN_PATHS.inventory}?status=INCOMING`}
          icon={<InboxOutlined />}
          tone="incoming"
        />
        <MetricCard
          title={CAR_STATUS_LABEL.RESERVED}
          description="Xe đã được khách hàng đặt cọc."
          result={reservedCars}
          linkLabel="Xem xe đã đặt cọc"
          to={`${ADMIN_PATHS.inventory}?status=RESERVED`}
          icon={<ClockCircleOutlined />}
          tone="reserved"
        />
      </section>

      <section className={styles.recentPanel} aria-labelledby="recent-vehicles-heading">
        <div className={styles.panelHeading}>
          <div>
            <h2 id="recent-vehicles-heading">Xe mới nhập gần đây</h2>
            <p>Tối đa 5 xe, sắp xếp theo ngày nhập kho mới nhất.</p>
          </div>
          <Link to={ADMIN_PATHS.inventory} className={styles.viewAllLink}>
            Xem tất cả xe <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
        <div aria-busy={recentCars.loading}>
          {recentCars.loading ? (
            <LoadingState text="Đang tải xe mới nhập…" />
          ) : recentCars.error ? (
            <ErrorState message={recentCars.error} />
          ) : recentCars.items.length === 0 ? (
            <div className={styles.emptyContent}>
              <EmptyState description="Chưa có xe trong kho. Nhập xe đầu tiên để bắt đầu quản lý." />
              <Link to={ADMIN_PATHS.vehicleIntake} className={styles.primaryAction}>
                <PlusOutlined aria-hidden="true" /> Nhập xe &amp; thẩm định
              </Link>
            </div>
          ) : (
            <div className={styles.tableWrap} role="region" aria-label="Danh sách xe mới nhập" tabIndex={0}>
              <table className={styles.vehicleTable} aria-labelledby="recent-vehicles-heading">
                <thead>
                  <tr>
                    <th scope="col">Xe</th>
                    <th scope="col">Giá bán</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Ngày nhập kho</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCars.items.map((car) => (
                    <RecentVehicle key={car._id || car.vehicleCode} car={car} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
