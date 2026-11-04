import { useState } from 'react'
import { Button, Skeleton } from 'antd'
import { CheckCircleFilled, ReloadOutlined, SafetyCertificateFilled } from '@ant-design/icons'
import { formatDate, formatMileage } from '../../../utils/format'
import { usePublicCertificate } from '../hooks/usePublicCertificate'
import PublicCertificateModal from './PublicCertificateModal'
import styles from '../styles/PublicCertificate.module.css'

function CertifiedBadge() {
  return (
    <span className={styles.badge}>
      <SafetyCertificateFilled /> TrustCar Certified
    </span>
  )
}

/**
 * SCR-M05 trên trang chi tiết xe công khai: huy hiệu + tóm tắt chứng nhận + nút mở chứng nhận.
 * Hiện huy hiệu theo car.cpoCertificateId (GET /public/cars/:id đã trả trường này);
 * chỉ khi có mã mới gọi /inspection-report. Xe không có mã: không hiện gì, không gọi API.
 *
 * @param {{ carKey: string|null, vehicleCode: string|null, cpoCertificateId: string|null }} props
 */
export default function PublicCertificateSection({ carKey, vehicleCode, cpoCertificateId }) {
  const { report, loading, failed, reload } = usePublicCertificate(cpoCertificateId ? carKey : null)
  const [open, setOpen] = useState(false)

  if (!cpoCertificateId) return null

  if (!report) {
    return (
      <section className={styles.card} aria-busy={loading}>
        <div className={styles.cardHead}>
          <CertifiedBadge />
          <span className={styles.code}>{cpoCertificateId}</span>
        </div>
        {loading && <Skeleton active title={false} paragraph={{ rows: 4 }} />}
        {!loading && failed && (
          <div className={styles.failed}>
            <span>Không tải được báo cáo chứng nhận.</span>
            <Button size="small" icon={<ReloadOutlined />} onClick={reload} className={styles.touch}>
              Thử lại
            </Button>
          </div>
        )}
        {!loading && !failed && <p className={styles.failed}>Báo cáo kiểm định đang được cập nhật.</p>}
      </section>
    )
  }

  const passedCount = report.groups.filter((group) => group.passed).length

  return (
    <section className={styles.card} aria-labelledby="cpo-certificate-heading">
      <div className={styles.cardHead}>
        <CertifiedBadge />
        <span className={styles.passCount}>
          Đạt {passedCount}/{report.groups.length} nhóm tiêu chí
        </span>
      </div>
      <h2 id="cpo-certificate-heading" className={styles.cardTitle}>
        Xe đạt chứng nhận TrustCar CPO
      </h2>
      <dl className={styles.facts}>
        <div>
          <dt>Mã chứng nhận</dt>
          <dd className={styles.code}>{report.certificateId}</dd>
        </div>
        <div>
          <dt>Ngày cấp</dt>
          <dd>{formatDate(report.issuedAt)}</dd>
        </div>
        <div>
          <dt>Số km xác nhận</dt>
          <dd>{formatMileage(report.vehicle?.mileage)}</dd>
        </div>
      </dl>
      <ul className={styles.checks}>
        {report.groups.map((group) => (
          <li key={group.key}>
            <CheckCircleFilled className={group.passed ? styles.pass : styles.fail} aria-hidden="true" />
            {group.label}
          </li>
        ))}
      </ul>
      <Button type="primary" size="large" block onClick={() => setOpen(true)} className={styles.touch}>
        Xem chứng nhận
      </Button>
      <PublicCertificateModal open={open} onClose={() => setOpen(false)} report={report} vehicleCode={vehicleCode} />
    </section>
  )
}
