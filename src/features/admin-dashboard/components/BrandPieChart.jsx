/**
 * KAN-35 – Biểu đồ tròn tỷ trọng xe theo hãng.
 *
 * Vẽ bằng SVG thuần (xem ghi chú ở RevenueLineChart). Mỗi múi là một <path> hình vành
 * khuyên; hover hoặc focus làm múi phình ra và hiện số liệu ở giữa.
 *
 * Truyền `value` = 0 cho tất cả thì hiện Empty thay vì vẽ vòng tròn rỗng.
 */

import { useState } from 'react'
import { Empty } from 'antd'
import { CHART_COLORS } from '../constants/dashboardConstants'
import styles from '../styles/AdminDashboardPage.module.css'

const SIZE = 240
const CENTER = SIZE / 2
const RADIUS = 92
const INNER = 56

/** Toạ độ trên vòng tròn, góc tính từ đỉnh 12 giờ theo chiều kim đồng hồ. */
function polar(radius, angle) {
  const radians = (angle - 90) * (Math.PI / 180)
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) }
}

/** Path của một hình vành khuyên từ góc start đến end. */
function ringSlice(startAngle, endAngle, outer = RADIUS, inner = INNER) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  const o1 = polar(outer, startAngle)
  const o2 = polar(outer, endAngle)
  const i1 = polar(inner, endAngle)
  const i2 = polar(inner, startAngle)
  return [
    `M${o1.x},${o1.y}`,
    `A${outer},${outer} 0 ${largeArc} 1 ${o2.x},${o2.y}`,
    `L${i1.x},${i1.y}`,
    `A${inner},${inner} 0 ${largeArc} 0 ${i2.x},${i2.y}`,
    'Z',
  ].join(' ')
}

export default function BrandPieChart({ data, metric = 'số xe' }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const total = (data ?? []).reduce((sum, item) => sum + item.value, 0)

  if (!data?.length || total === 0) {
    return <Empty description="Chưa có dữ liệu xe theo hãng" />
  }

  // Dựng dần bằng reduce để không đột biến biến ngoài trong lúc render.
  const slices = data.reduce((acc, item, index) => {
    const prevAngle = acc.length ? acc[acc.length - 1].endAngle : 0
    const angle = (item.value / total) * 360
    const endAngle = prevAngle + angle
    acc.push({
      ...item,
      index,
      color: CHART_COLORS[index % CHART_COLORS.length],
      path: ringSlice(prevAngle, endAngle),
      endAngle,
      percent: (item.value / total) * 100,
    })
    return acc
  }, [])

  const active = activeIndex !== null ? slices[activeIndex] : null

  return (
    <div className={styles.pieBlock}>
      <div className={styles.pieWrap}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.pieSvg}
          role="img"
          aria-label={`Tỷ trọng ${metric} theo hãng`}
        >
          {slices.map((slice) => (
            <path
              key={slice.name}
              d={slice.path}
              fill={slice.color}
              className={activeIndex === slice.index ? styles.sliceActive : styles.slice}
              onMouseEnter={() => setActiveIndex(slice.index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(slice.index)}
              onBlur={() => setActiveIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${slice.name}: ${slice.value} ${metric}, ${slice.percent.toFixed(0)}%`}
            />
          ))}
          <text x={CENTER} y={CENTER - 4} textAnchor="middle" className={styles.pieCenterValue}>
            {active ? active.value : total}
          </text>
          <text x={CENTER} y={CENTER + 16} textAnchor="middle" className={styles.pieCenterLabel}>
            {active ? active.name : `tổng ${metric}`}
          </text>
        </svg>
      </div>

      <ul className={styles.legend}>
        {slices.map((slice) => (
          <li key={slice.name} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: slice.color }} aria-hidden="true" />
            <span className={styles.legendName}>{slice.name}</span>
            <span className={styles.legendValue}>
              {slice.value} · {slice.percent.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
