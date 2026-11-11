import { Link } from 'react-router-dom'
import { Tag } from 'antd'
import { EmptyState, ErrorState, LoadingState } from '../../../components/common/StateBlock'
import { getCarTitle } from '../../../utils/car'
import { formatDate } from '../../../utils/format'
import { CAR_STATUS_META } from '../../inspection/constants/inspectionConstants'
import { getInspectionDetailLink } from '../constants/inspectionDashboardConstants'
import { getWaitingDays } from '../utils/inspectionDashboardUtils'
import styles from '../styles/InspectionDashboardPage.module.css'

export default function OldestPendingCars({ items, loading, error, onRetry }) {
  if (loading) return <LoadingState text="Đang tải xe chờ kiểm định..." />
  if (error) return <ErrorState message="Không tải được danh sách xe chờ kiểm định." onRetry={onRetry} />
  if (items.length === 0) return <EmptyState description="Không còn xe nào chờ kiểm định." />

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} aria-label="Xe chờ kiểm định lâu nhất">
        <thead>
          <tr>
            <th>Mã xe</th>
            <th>Xe</th>
            <th>Biển số</th>
            <th>Trạng thái</th>
            <th>Ngày nhập</th>
            <th>Đã chờ</th>
            <th className={styles.actionCol}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map((car) => {
            const meta = CAR_STATUS_META[car.status]
            const days = getWaitingDays(car.createdAt)
            return (
              <tr key={car._id}>
                <td className={styles.code}>{car.vehicleCode || '—'}</td>
                <td>{getCarTitle(car)}{car.year ? ` ${car.year}` : ''}</td>
                <td>{car.licensePlate || '—'}</td>
                <td><Tag color={meta?.color}>{meta?.label ?? car.status}</Tag></td>
                <td>{formatDate(car.createdAt)}</td>
                <td>{days === null ? '—' : `${days} ngày`}</td>
                <td className={styles.actionCol}>
                  <Link to={getInspectionDetailLink(car._id)} className={styles.rowLink}>
                    Mở kiểm định<span className={styles.srOnly}> xe {car.vehicleCode || getCarTitle(car)}</span>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
