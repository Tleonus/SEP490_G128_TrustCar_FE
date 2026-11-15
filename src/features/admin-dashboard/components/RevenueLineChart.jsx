/**
 * KAN-35 – Biểu đồ đường doanh thu theo tháng.
 *
 * Vẽ bằng SVG thuần: dự án chưa cài recharts hay @ant-design/plots, và ràng buộc công việc
 * là không tự sửa package.json. SVG thủ công không thêm dependency, nhẹ hơn và kiểm soát
 * được màu theo token CSS của dự án.
 *
 * Có tooltip khi hover: mỗi tháng là một cột bắt sự kiện (trong suốt, phủ toàn chiều cao)
 * nên rê chuột ở đâu trong cột cũng hiện số liệu.
 */

import { useId, useState } from 'react'
import { Empty } from 'antd'
import { formatVndCompact, formatVndFull } from '../utils/dashboardMetrics'
import styles from '../styles/AdminDashboardPage.module.css'

const WIDTH = 720
const HEIGHT = 260
const PADDING = { top: 16, right: 16, bottom: 34, left: 56 }

/**
 * Chia trục tung thành các mốc tròn trịa.
 * @param {number} max
 * @param {number} ticks
 */
function niceTicks(max, ticks = 4) {
  if (!Number.isFinite(max) || max <= 0) return [0, 1]
  const rough = max / ticks
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / magnitude
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude
  const top = Math.ceil(max / step) * step
  const result = []
  for (let value = 0; value <= top + step / 2; value += step) result.push(value)
  return result
}

export default function RevenueLineChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const gradientId = useId()

  if (!data?.length) {
    return <Empty description="Chưa có dữ liệu doanh thu" />
  }

  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0)

  // Không có đồng nào: vẽ trục 0..1 và một đường phẳng chỉ gây hiểu nhầm là "có dữ liệu".
  if (maxRevenue <= 0) {
    return <Empty description="Chưa có xe nào được bán trong các tháng này" />
  }

  const ticks = niceTicks(maxRevenue)
  const top = ticks.at(-1) || 1

  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0
  const xOf = (index) => PADDING.left + (data.length > 1 ? index * stepX : plotWidth / 2)
  const yOf = (value) => PADDING.top + plotHeight - (value / top) * plotHeight

  const points = data.map((d, i) => ({ ...d, x: xOf(i), y: yOf(d.revenue) }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points.at(-1).x},${PADDING.top + plotHeight} L${points[0].x},${PADDING.top + plotHeight} Z`
  const bandWidth = data.length > 1 ? stepX : plotWidth

  return (
    <div className={styles.chartWrap}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Doanh thu ${data.length} tháng gần nhất`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lưới ngang + nhãn trục tung */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              className={styles.gridLine}
            />
            <text x={PADDING.left - 10} y={yOf(tick) + 4} textAnchor="end" className={styles.axisLabel}>
              {formatVndCompact(tick)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} className={styles.linePath} />

        {points.map((point, index) => (
          <g key={point.key ?? point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? 5.5 : 4}
              className={activeIndex === index ? styles.dotActive : styles.dot}
            />
            <text
              x={point.x}
              y={HEIGHT - PADDING.bottom + 20}
              textAnchor="middle"
              className={activeIndex === index ? styles.axisLabelActive : styles.axisLabel}
            >
              {point.label}
            </text>
            {/* Vùng bắt hover phủ cả chiều cao để dễ trỏ */}
            <rect
              x={point.x - bandWidth / 2}
              y={PADDING.top}
              width={bandWidth}
              height={plotHeight}
              className={styles.hoverBand}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${point.label}: ${formatVndFull(point.revenue)}, ${point.soldCount} xe`}
            />
          </g>
        ))}
      </svg>

      {activeIndex !== null && points[activeIndex] && (
        <div
          className={styles.chartTooltip}
          style={{ left: `${(points[activeIndex].x / WIDTH) * 100}%` }}
          role="status"
        >
          <strong>{points[activeIndex].label}</strong>
          <span>{formatVndFull(points[activeIndex].revenue)}</span>
          <span>{points[activeIndex].soldCount} xe đã bán</span>
        </div>
      )}

      <ul className={styles.srOnly}>
        {data.map((item) => (
          <li key={item.key ?? item.label}>
            {item.label}: {formatVndFull(item.revenue)}, {item.soldCount} xe đã bán
          </li>
        ))}
      </ul>
    </div>
  )
}
