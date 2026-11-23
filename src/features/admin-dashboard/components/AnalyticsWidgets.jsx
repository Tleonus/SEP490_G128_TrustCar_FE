/**
 * KAN-100 — Bộ widget phân tích cho trang Admin.
 *
 * Mặc dù SPEC ghi Chart.js, project chưa cài thư viện chart (xem KAN-35
 * `RevenueLineChart` cũng vẽ SVG thuần). Giữ convention đó tránh thêm
 * dependency vào `package.json` và tránh lẫn 2 lib chart.
 *
 * Mỗi component là một figure + figcaption cho accessibility, cùng tone màu
 * của `AdminDashboardPage.module.css`. Mọi tính toán ở client — payload vừa
 * nhẹ (5 mảng) nên không cần memo phức tạp.
 */

import { useId, useState } from 'react'
import { Empty, Select } from 'antd'
import styles from '../styles/AdminDashboardPage.module.css'
import { formatVndCompact, formatVndFull } from '../utils/dashboardMetrics'

const monthLabel = (iso) => {
  // "2026-10" → "T10" (compact for narrow screens).
  const [, mm] = iso.split('-')
  return `T${Number(mm)}`
}

// ────────────────────────────────────────────────────────────────────────────
// Date-range filter (preset 7D / 30D / 90D / 6M / 12M)
// ────────────────────────────────────────────────────────────────────────────

const RANGE_PRESETS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: '180', label: '6 tháng' },
  { value: '365', label: '12 tháng' },
]

/**
 * KAN-100 — preset date-range filter. `onChange({from, to})` nhận cả hai Date.
 * Không dùng DatePicker.RangePicker của antd để giữ API tối giản — đủ cho DoD.
 */
export function AnalyticsDateRangeFilter({ range, onChange }) {
  const days = range?.from && range?.to
    ? Math.round((range.to - range.from) / (24 * 60 * 60 * 1000))
    : 180
  const current = RANGE_PRESETS.find((p) => Number(p.value) === days)?.value || '180'

  const handleChange = (value) => {
    const to = new Date()
    const from = new Date(to.getTime() - Number(value) * 24 * 60 * 60 * 1000)
    onChange?.({ from, to })
  }

  return (
    <div className={styles.analyticsFilter}>
      <label htmlFor="analytics-range" className={styles.analyticsFilterLabel}>
        Khoảng thời gian
      </label>
      <Select
        id="analytics-range"
        value={current}
        onChange={handleChange}
        options={RANGE_PRESETS}
        style={{ minWidth: 160 }}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// (1) salesByMonth — line chart 6 tháng
// ────────────────────────────────────────────────────────────────────────────

const LINE_WIDTH = 720
const LINE_HEIGHT = 240
const LINE_PADDING = { top: 16, right: 16, bottom: 32, left: 56 }

function niceTicks(max, ticks = 4) {
  if (!Number.isFinite(max) || max <= 0) return [0, 1]
  const rough = max / ticks
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / magnitude
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude
  const top = Math.ceil(max / step) * step
  const result = []
  for (let v = 0; v <= top + step / 2; v += step) result.push(v)
  return result
}

export function SalesByMonthLine({ data = [] }) {
  const [active, setActive] = useState(null)
  const gradientId = useId()

  if (!data.length) return <Empty description="Chưa có doanh số" />

  const max = Math.max(1, ...data.map((d) => d.revenue))
  const ticks = niceTicks(max)
  const yMax = ticks[ticks.length - 1]
  const plotW = LINE_WIDTH - LINE_PADDING.left - LINE_PADDING.right
  const plotH = LINE_HEIGHT - LINE_PADDING.top - LINE_PADDING.bottom
  const step = data.length > 1 ? plotW / (data.length - 1) : 0

  const points = data.map((d, i) => {
    const x = LINE_PADDING.left + i * step
    const y = LINE_PADDING.top + plotH * (1 - d.revenue / yMax)
    return { x, y, d }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const fill = `${path} L${points[points.length - 1].x},${LINE_PADDING.top + plotH} L${points[0].x},${LINE_PADDING.top + plotH} Z`

  const activePoint = active != null ? points[active] : null
  const totalSales = data.reduce((s, d) => s + d.count, 0)
  const peak = data.reduce((m, d) => (d.count > m.count ? d : m), data[0])

  return (
    <figure className={styles.analyticsFigure}>
      <svg viewBox={`0 0 ${LINE_WIDTH} ${LINE_HEIGHT}`} role="img" aria-label="Doanh số 6 tháng" className={styles.analyticsSvg}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#1677ff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#1677ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => {
          const y = LINE_PADDING.top + plotH * (1 - t / yMax)
          return (
            <g key={t}>
              <line x1={LINE_PADDING.left} x2={LINE_WIDTH - LINE_PADDING.right} y1={y} y2={y} stroke="#eef0f4" />
              <text x={LINE_PADDING.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#8c8c8c">
                {formatVndCompact(t)}
              </text>
            </g>
          )
        })}
        <path d={fill} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="#1677ff" strokeWidth="2.5" />
        {points.map((p, i) => (
          <g key={p.d.month}>
            <circle cx={p.x} cy={p.y} r={active === i ? 6 : 4} fill="#fff" stroke="#1677ff" strokeWidth="2" />
            <rect
              x={p.x - step / 2}
              y={LINE_PADDING.top}
              width={step}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
            <text x={p.x} y={LINE_HEIGHT - 10} textAnchor="middle" fontSize="11" fill="#595959">
              {monthLabel(p.d.month)}
            </text>
          </g>
        ))}
        {activePoint && (
          <g>
            <rect x={activePoint.x - 70} y={activePoint.y - 48} width="140" height="40" rx="6" fill="#1f1f1f" opacity="0.92" />
            <text x={activePoint.x} y={activePoint.y - 30} textAnchor="middle" fontSize="12" fill="#fff">
              {activePoint.d.count} xe · {formatVndCompact(activePoint.d.revenue)}
            </text>
            <text x={activePoint.x} y={activePoint.y - 14} textAnchor="middle" fontSize="11" fill="#bfbfbf">
              Tháng {Number(activePoint.d.month.split('-')[1])}
            </text>
          </g>
        )}
      </svg>
      <figcaption className={styles.analyticsCaption}>
        Doanh số 6 tháng: tổng {totalSales} xe, cao nhất {peak.count} xe vào tháng {Number(peak.month.split('-')[1])} ({formatVndFull(peak.revenue)}).
      </figcaption>
    </figure>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// (2) leadsFunnel — cascading bar
// ────────────────────────────────────────────────────────────────────────────

const FUNNEL_STAGES = [
  { key: 'visitors', label: 'Lượt truy cập', color: '#1677ff' },
  { key: 'leads', label: 'Lead', color: '#13c2c2' },
  { key: 'appointments', label: 'Lịch hẹn', color: '#52c41a' },
  { key: 'sales', label: 'Chốt bán', color: '#fa8c16' },
]

export function LeadsFunnelChart({ data }) {
  if (!data || data.visitors + data.leads + data.appointments + data.sales === 0) {
    return <Empty description="Chưa có lượt truy cập trong khoảng này" />
  }

  const max = Math.max(1, data.visitors, data.leads, data.appointments, data.sales)
  const rates = data.conversionRates || {}
  const rateByIndex = [null, rates.leadRate, rates.apptRate, rates.saleRate]

  return (
    <figure className={styles.analyticsFigure}>
      <ul className={styles.funnelList}>
        {FUNNEL_STAGES.map((stage, i) => {
          const value = data[stage.key] ?? 0
          const width = (value / max) * 100
          return (
            <li key={stage.key} className={styles.funnelRow}>
              <span className={styles.funnelLabel}>{stage.label}</span>
              <div className={styles.funnelBarWrap}>
                <div
                  className={styles.funnelBar}
                  style={{ width: `${width}%`, background: stage.color }}
                />
                <span className={styles.funnelValue}>{value.toLocaleString('vi-VN')}</span>
              </div>
              {rateByIndex[i] != null && (
                <span className={styles.funnelRate} title="Tỉ lệ chuyển đổi từ bước trước">
                  → {rateByIndex[i]}%
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <figcaption className={styles.analyticsCaption}>
        Funnel: {data.visitors.toLocaleString('vi-VN')} truy cập →
        {' '}{data.leads} lead ({rates.leadRate}%) →
        {' '}{data.appointments} lịch hẹn ({rates.apptRate}%) →
        {' '}{data.sales} xe bán ({rates.saleRate}%).
      </figcaption>
    </figure>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// (3) topCars — horizontal bar
// ────────────────────────────────────────────────────────────────────────────

export function TopCarsBar({ data = [] }) {
  if (!data.length) return <Empty description="Chưa có xe bán ra" />

  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <figure className={styles.analyticsFigure}>
      <ul className={styles.topCarsList}>
        {data.map((car, i) => (
          <li key={car.carId || i} className={styles.topCarRow}>
            <span className={styles.topCarRank}>#{i + 1}</span>
            <div className={styles.topCarMeta}>
              <strong className={styles.topCarTitle}>{car.title}</strong>
              {car.vehicleCode && <span className={styles.topCarCode}>{car.vehicleCode}</span>}
            </div>
            <div className={styles.topCarBarWrap} aria-label={`${car.count} xe bán`}>
              <div className={styles.topCarBar} style={{ width: `${(car.count / max) * 100}%` }} />
              <span className={styles.topCarValue}>{car.count} xe · {formatVndCompact(car.revenue)}</span>
            </div>
          </li>
        ))}
      </ul>
      <figcaption className={styles.analyticsCaption}>
        Top {data.length} xe bán chạy trong kỳ, dẫn đầu là {data[0].title} với {data[0].count} xe.
      </figcaption>
    </figure>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// (4) revenueByStaff — vertical bar
// ────────────────────────────────────────────────────────────────────────────

export function RevenueByStaffBar({ data = [] }) {
  if (!data.length) return <Empty description="Chưa có nhân viên nào chốt được xe" />

  const max = Math.max(1, ...data.map((s) => s.revenue))
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0)
  const totalDeals = data.reduce((s, r) => s + r.deals, 0)

  return (
    <figure className={styles.analyticsFigure}>
      <ul className={styles.staffList}>
        {data.map((staff) => (
          <li key={staff.userId} className={styles.staffRow}>
            <div className={styles.staffMeta}>
              <strong>{staff.fullName || staff.email || 'Nhân viên'}</strong>
              <span className={styles.staffEmail}>{staff.email}</span>
            </div>
            <div className={styles.staffBarWrap}>
              <div className={styles.staffBar} style={{ width: `${(staff.revenue / max) * 100}%` }} />
              <span className={styles.staffValue}>
                {staff.deals} deal · {formatVndCompact(staff.revenue)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <figcaption className={styles.analyticsCaption}>
        Top {data.length} sales: tổng {totalDeals} deal, doanh thu {formatVndFull(totalRevenue)}.
      </figcaption>
    </figure>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// (5) avgDaysInStock — KPI tile (không có chart)
// ────────────────────────────────────────────────────────────────────────────

export function AvgDaysInStockTile({ value }) {
  const label = value == null ? '—' : value.toLocaleString('vi-VN')
  const hint = value == null
    ? 'Chưa có xe bán ra trong kỳ nên không tính được số ngày trung bình.'
    : 'Số ngày trung bình xe nằm trong kho từ khi nhập cho tới khi bán ra, tính trong khoảng đang chọn.'
  return (
    <div className={styles.analyticsTile}>
      <span className={styles.analyticsTileEyebrow}>Trung bình tồn kho</span>
      <div className={styles.analyticsTileValue}>{label} <small>ngày</small></div>
      <p className={styles.analyticsTileHint}>{hint}</p>
    </div>
  )
}
