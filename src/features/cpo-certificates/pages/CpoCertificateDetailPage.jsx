import { Alert, Button, Card, Skeleton } from 'antd'
import { ArrowLeftOutlined, ExportOutlined, SafetyCertificateFilled } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import { getCarTitle } from '../../../utils/car'
import CertificateErrorState from '../components/CertificateErrorState'
import CertificateStatusTag from '../components/CertificateStatusTag'
import { CERT_CAR_STATUS_LABEL } from '../constants/cpoCertificateConstants'
import CertificateReportBody from '../components/CertificateReportBody'
import QrCodePanel from '../components/QrCodePanel'
import { useCertificateDetail } from '../hooks/useCertificateQueries'
import { getQrEligibility } from '../utils/qrEligibility'
import { buildPublicCarUrl, getConfiguredPublicBaseUrl } from '../utils/qrTargetUrl'
import styles from '../styles/CpoCertificateDetailPage.module.css'

const LIST_PATH = '/admin/chung-nhan'

/** Chi tiết một chứng nhận CPO (ADMIN, SALES_STAFF). */
export default function CpoCertificateDetailPage() {
  const { carId } = useParams()
  const { data, loading, error, reload } = useCertificateDetail(carId)

  const back = (
    <Link to={LIST_PATH} className={styles.back}>
      <ArrowLeftOutlined /> Danh sách chứng nhận
    </Link>
  )

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true">
        {back}
        <Skeleton active paragraph={{ rows: 2 }} />
        <div className={styles.layout}>
          <Card><Skeleton active paragraph={{ rows: 10 }} /></Card>
          <Card><Skeleton.Image active className={styles.qrSkeleton} /></Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        {back}
        <CertificateErrorState error={error} onRetry={reload} backTo={LIST_PATH} />
      </div>
    )
  }

  const { summary, report } = data
  const publicKey = summary.vehicleCode || summary.carId
  const { eligible } = getQrEligibility(summary.carStatus)
  const publicUrl = eligible ? buildPublicCarUrl({ baseUrl: getConfiguredPublicBaseUrl(), carId: publicKey }) : null
  const vehicle = report?.vehicle ?? summary.vehicle
  const vehicleTitle = `${getCarTitle(vehicle)} ${vehicle?.year ?? ''}`.trim()
  const certificateId = report?.certificateId ?? summary.certificateId

  return (
    <div className={styles.page}>
      {back}
      <header className={styles.header}>
        <div className={styles.badge}>
          <SafetyCertificateFilled /> TrustCar Certified
        </div>
        <h1 className={styles.code}>{certificateId}</h1>
        <div className={styles.headerMeta}>
          <span className={styles.vehicleTitle}>{vehicleTitle}</span>
          <CertificateStatusTag status={summary.carStatus} />
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          {report ? (
            <CertificateReportBody report={report} vehicleCode={summary.vehicleCode} audience="staff" />
          ) : (
            // BE chỉ trả báo cáo công khai cho xe APPROVED_CPO/AVAILABLE; chưa có API nội bộ cho các trạng thái khác.
            <Alert
              type="info"
              showIcon
              title="Không xem được báo cáo kiểm định"
              description={`Xe đang ở trạng thái "${CERT_CAR_STATUS_LABEL[summary.carStatus] || summary.carStatus}". Báo cáo kiểm định chỉ xem được khi xe đạt CPO hoặc đang bán.`}
            />
          )}
        </div>

        <aside className={styles.sideCol}>
          <Card title="Mã QR và tem in">
            <QrCodePanel
              publicCarKey={publicKey}
              certificateId={certificateId}
              carStatus={summary.carStatus}
              vehicleTitle={vehicleTitle}
            />
          </Card>
          <Button
            size="large"
            block
            icon={<ExportOutlined />}
            href={publicUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!publicUrl}
            className={styles.touch}
          >
            Mở báo cáo công khai
          </Button>
        </aside>
      </div>
    </div>
  )
}
