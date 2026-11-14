import { listTestDrives } from '../api/testDriveApi'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { TEST_DRIVE_STATUS } from '../constants/testDriveConstants'
import styles from '../styles/TestDriveManagement.module.css'

const countOf = (params) => listTestDrives({ page: 1, limit: 1, ...params }).then((result) => result.total)

function KpiCard({ label, resource, tone, onClick }) {
  // Đang tải hoặc lỗi thì hiện dấu gạch, không hiện 0 để tránh hiểu nhầm là không có lịch.
  const value = resource.loading || resource.error ? '—' : resource.data
  return (
    <button type="button" className={`${styles.kpi} ${tone === 'warning' ? styles.kpiWarning : ''}`} onClick={onClick}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
    </button>
  )
}

export default function TestDriveKpis({ date, refreshKey, onShowStatus, onShowAttention }) {
  const pending = useAsyncResource(() => countOf({ date, status: TEST_DRIVE_STATUS.PENDING }), `pending|${date}|${refreshKey}`)
  const confirmed = useAsyncResource(() => countOf({ date, status: TEST_DRIVE_STATUS.CONFIRMED }), `confirmed|${date}|${refreshKey}`)
  const attention = useAsyncResource(() => countOf({ needsAttention: true }), `attention|${refreshKey}`)

  return (
    <div className={styles.kpis}>
      <KpiCard label="Chờ xác nhận trong ngày" resource={pending} onClick={() => onShowStatus(TEST_DRIVE_STATUS.PENDING)} />
      <KpiCard label="Đã xác nhận trong ngày" resource={confirmed} onClick={() => onShowStatus(TEST_DRIVE_STATUS.CONFIRMED)} />
      <KpiCard label="Cần xử lý, tính mọi ngày" resource={attention} tone="warning" onClick={onShowAttention} />
    </div>
  )
}
