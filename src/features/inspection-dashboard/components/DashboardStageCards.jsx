import { Link } from 'react-router-dom'
import { DASHBOARD_STAGES, getStageLink } from '../constants/inspectionDashboardConstants'
import styles from '../styles/InspectionDashboardPage.module.css'

function CardBody({ stage, count }) {
  return (
    <>
      <span className={styles.stageLabel}>{stage.label}</span>
      <span className={styles.stageValue}>{count === undefined ? '…' : count ?? '—'}</span>
      <span className={styles.stageHint}>{stage.hint}</span>
    </>
  )
}

// Mỗi thẻ là số liệu của một giai đoạn và dẫn sang màn xử lý giai đoạn đó.
export default function DashboardStageCards({ counts, roleName }) {
  return (
    <div className={styles.stageRow}>
      {DASHBOARD_STAGES.map((stage) => {
        const className = `${styles.stageCard} ${styles[`stage${stage.color}`] ?? ''}`
        const link = getStageLink(stage.status, roleName)
        const count = counts[stage.status]
        return link ? (
          <Link key={stage.status} to={link} className={`${className} ${styles.stageLink}`} aria-label={`${stage.label}: ${count ?? 'chưa rõ'} xe. Mở danh sách`}>
            <CardBody stage={stage} count={count} />
          </Link>
        ) : (
          <div key={stage.status} className={className}>
            <CardBody stage={stage} count={count} />
          </div>
        )
      })}
    </div>
  )
}
