/**
 * KAN-35 – Thẻ KPI ở đầu trang Tổng quan.
 *
 * Dùng Card + Statistic của antd. Thẻ "Chờ duyệt" là liên kết thật sang /admin/approval
 * (yêu cầu AC) nên cả thẻ là một <Link>; các thẻ khác không bấm được.
 *
 * `delta` là số phụ so với tháng trước: { value, unit, positiveIsGood }.
 *   - delta = null        → không tính được (tháng trước chưa có dữ liệu), không hiện gì.
 *   - delta.value === 0   → không hiện, vì "0% so với tháng trước" chỉ làm rối.
 */

import { Link } from 'react-router-dom'
import { Card, Skeleton, Statistic } from 'antd'
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined } from '@ant-design/icons'
import styles from '../styles/AdminDashboardPage.module.css'

const deltaFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

export default function KpiCard({
  title,
  value,
  suffix,
  formatter,
  delta,
  description,
  icon,
  tone,
  to,
  linkLabel,
  loading,
  error,
  hint,
}) {
  const hasDelta = Boolean(delta) && Number.isFinite(delta?.value) && delta.value !== 0
  const isUp = hasDelta && delta.value > 0
  const good = hasDelta ? (isUp ? delta?.positiveIsGood !== false : delta?.positiveIsGood === false) : null

  const card = (
    <Card
      className={`${styles.kpiCard} ${styles[tone]}`}
      variant="borderless"
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 10, height: '100%' } }}
    >
      <div className={styles.kpiHead}>
        <span className={styles.kpiTitle}>{title}</span>
        <span className={styles.kpiIcon} aria-hidden="true">{icon}</span>
      </div>

      {loading ? (
        <div className={styles.kpiSkeleton}>
          <Skeleton active paragraph={{ rows: 1, width: '60%' }} title={{ width: '45%' }} />
        </div>
      ) : error ? (
        <p className={styles.kpiError} role="alert">{error}</p>
      ) : (
        <>
          <Statistic
            value={value ?? 0}
            suffix={suffix}
            formatter={formatter}
            styles={{ content: { fontSize: 'clamp(20px, 1.7vw, 26px)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, overflowWrap: 'anywhere' } }}
          />

          <div className={styles.kpiFoot}>
            {hasDelta ? (
              <span className={good ? styles.deltaGood : styles.deltaBad}>
                {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {deltaFormatter.format(Math.abs(delta.value))}{delta.unit ?? ''}
                <span className={styles.deltaCaption}>so với tháng trước</span>
              </span>
            ) : null}
            {description && <span className={styles.kpiDescription}>{description}</span>}
            {hint && <span className={styles.kpiHint}>{hint}</span>}
          </div>
        </>
      )}

      {to && (
        <span className={styles.kpiMore}>
          {linkLabel ?? 'Xem chi tiết'} <ArrowRightOutlined aria-hidden="true" />
        </span>
      )}
    </Card>
  )

  if (!to) return card

  return (
    <Link to={to} className={styles.kpiLink} aria-label={`${title} — ${linkLabel ?? 'xem chi tiết'}`}>
      {card}
    </Link>
  )
}
