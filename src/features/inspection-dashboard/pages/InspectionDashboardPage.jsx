import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { ADMIN_PATHS } from '../../../router/paths'
import { useAuthStore } from '../../../store/useAuthStore'
import DashboardStageCards from '../components/DashboardStageCards'
import OldestPendingCars from '../components/OldestPendingCars'
import { useOldestPendingCars } from '../hooks/useOldestPendingCars'
import { useStageCounts } from '../hooks/useStageCounts'
import styles from '../styles/InspectionDashboardPage.module.css'

export default function InspectionDashboardPage() {
  const roleName = useAuthStore((state) => state.user?.roleName)
  const [reloadKey, setReloadKey] = useState(0)
  const counts = useStageCounts(reloadKey)
  const oldest = useOldestPendingCars(reloadKey)
  const reload = () => setReloadKey((key) => key + 1)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>KIỂM ĐỊNH CPO</span>
          <h1 className={styles.title}>Tổng quan kiểm định</h1>
          <p className={styles.desc}>Số xe ở từng giai đoạn kiểm định và những xe đã chờ lâu nhất.</p>
        </div>
        <Button size="large" icon={<ReloadOutlined />} loading={oldest.loading} onClick={reload}>Tải lại</Button>
      </div>

      <DashboardStageCards counts={counts} roleName={roleName} />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Chờ lâu nhất</h2>
        <Link to={ADMIN_PATHS.inspection} className={styles.rowLink}>Xem hàng đợi kiểm định</Link>
      </div>
      <OldestPendingCars {...oldest} onRetry={reload} />
    </div>
  )
}
