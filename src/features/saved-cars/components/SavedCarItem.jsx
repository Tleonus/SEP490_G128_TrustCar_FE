import { Link } from 'react-router-dom'
import { Popconfirm, Tooltip } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BellFilled,
  BellOutlined,
  CalendarOutlined,
  CarOutlined,
  DashboardOutlined,
  DeleteOutlined,
  EyeOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { formatMileage, formatPrice } from '../../../utils/format'
import CompareToggle from '../../vehicle-compare/components/CompareToggle'
import {
  formatCompactPrice,
  formatRelativeTime,
  getPriceChange,
  hasUnseenAlert,
  isTargetReached,
} from '../utils/savedCars'
import styles from './SavedCarItem.module.css'

function Sparkline({ history, direction }) {
  const points = history.map((h) => h.price)
  if (points.length < 2) {
    return <div className={styles.sparkEmpty}>Chưa có biến động giá</div>
  }
  const width = 128
  const height = 38
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const coords = points.map((p, i) => [
    (i / (points.length - 1)) * width,
    height - 5 - ((p - min) / range) * (height - 10),
  ])
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`
  const [lastX, lastY] = coords[coords.length - 1]

  return (
    <svg className={`${styles.spark} ${styles[direction]}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon points={area} className={styles.sparkArea} />
      <polyline points={line} className={styles.sparkLine} />
      <circle cx={lastX} cy={lastY} r="3.5" className={styles.sparkDot} />
    </svg>
  )
}

/** Một xe trong danh sách đã lưu: giá hiện tại, biến động so với lúc lưu, cảnh báo và thao tác. */
export default function SavedCarItem({ item, onEditAlert, onRemove }) {
  const change = getPriceChange(item)
  const unavailable = item.status === 'UNAVAILABLE'
  const reached = isTargetReached(item)
  const isNew = hasUnseenAlert(item)
  const detailUrl = `/xe/${encodeURIComponent(item.routeKey)}`
  const compareCar = item.rawId
    ? { _id: item.rawId, make: item.title, images: item.image ? [{ url: item.image }] : [], price: item.currentPrice }
    : null

  const cardClass = [
    styles.card,
    unavailable ? styles.unavailable : '',
    change.direction === 'down' && !unavailable ? styles.dropped : '',
  ].filter(Boolean).join(' ')

  return (
    <article className={cardClass}>
      <Link to={detailUrl} className={styles.media} tabIndex={-1} aria-hidden="true">
        {item.image ? (
          <img src={item.image} alt="" loading="lazy" />
        ) : (
          <div className={styles.noImage}>
            <span className={styles.noImageIcon}><CarOutlined /></span>
            <span>{item.vehicleCode || 'TrustCar'}</span>
          </div>
        )}
        {change.direction === 'down' && !unavailable && (
          <span className={styles.dropRibbon}>
            <ArrowDownOutlined /> Giảm {change.percent.toFixed(1)}%
          </span>
        )}
        {unavailable && (
          <span className={styles.soldOverlay}>
            <StopOutlined /> Không còn bán
          </span>
        )}
      </Link>

      <div className={styles.body}>
        <div className={styles.head}>
          <div className={styles.titleWrap}>
            <Link to={detailUrl} className={styles.title}>{item.title}</Link>
            <div className={styles.meta}>
              {item.vehicleCode && <span className={styles.code}>{item.vehicleCode}</span>}
              {item.year && <span className={styles.metaTag}><CalendarOutlined /> {item.year}</span>}
              {item.mileage != null && <span className={styles.metaTag}><DashboardOutlined /> {formatMileage(item.mileage)}</span>}
            </div>
          </div>
          {isNew && <span className={styles.newBadge}>Mới giảm giá</span>}
        </div>

        <div className={styles.priceGrid}>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>Giá hiện tại</span>
            <strong className={styles.price}>{formatPrice(item.currentPrice)}</strong>
            {change.direction !== 'flat' && !unavailable ? (
              <span className={`${styles.delta} ${styles[change.direction]}`}>
                {change.direction === 'down' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                {change.direction === 'down' ? 'Giảm ' : 'Tăng '}
                {formatCompactPrice(Math.abs(change.amount))}
                <s>{formatCompactPrice(item.savedPrice)}</s>
              </span>
            ) : (
              <span className={styles.deltaFlat}>Giá giữ nguyên từ lúc lưu</span>
            )}
          </div>

          <div className={styles.sparkWrap}>
            <span className={styles.sparkLabel}>Biểu đồ giá</span>
            <Sparkline history={item.history} direction={change.direction} />
            <span className={styles.savedTime}>Đã lưu {formatRelativeTime(item.savedAt)}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.alertChip} ${item.alert.enabled ? styles.alertOn : ''} ${reached ? styles.alertReached : ''}`}
            onClick={() => onEditAlert(item)}
            disabled={unavailable}
          >
            {item.alert.enabled ? <BellFilled /> : <BellOutlined />}
            <span>
              {item.alert.enabled && item.alert.targetPrice != null
                ? reached
                  ? `Đã chạm mục tiêu ${formatCompactPrice(item.alert.targetPrice)}`
                  : `Cảnh báo khi ≤ ${formatCompactPrice(item.alert.targetPrice)}`
                : 'Đặt cảnh báo giảm giá'}
            </span>
          </button>

          <div className={styles.actions}>
            {compareCar && !unavailable && <CompareToggle car={compareCar} variant="card" />}
            <Tooltip title="Xem chi tiết xe">
              <Link to={detailUrl} className={styles.iconActionBtn} aria-label={`Xem chi tiết ${item.title}`}>
                <EyeOutlined />
              </Link>
            </Tooltip>
            <Popconfirm
              title="Bỏ lưu xe này?"
              description="Cảnh báo giá của xe cũng sẽ bị xóa."
              okText="Bỏ lưu"
              cancelText="Giữ lại"
              okButtonProps={{ danger: true }}
              onConfirm={() => onRemove(item)}
            >
              <button type="button" className={`${styles.iconActionBtn} ${styles.dangerActionBtn}`} aria-label={`Bỏ lưu ${item.title}`}>
                <DeleteOutlined />
              </button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </article>
  )
}
