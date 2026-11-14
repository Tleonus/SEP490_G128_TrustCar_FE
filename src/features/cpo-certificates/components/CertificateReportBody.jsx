import { Alert, Card } from 'antd'
import CertificateGroupResults, { PhotoGrid } from './CertificateGroupResults'
import CertifiedVehicleInfo from './CertifiedVehicleInfo'
import { REPORT_LEVEL } from '../constants/cpoCertificateConstants'
import styles from '../styles/CpoCertificateDetailPage.module.css'

const OVERVIEW_LABELS = { FRONT: 'Phía trước', REAR: 'Phía sau', LEFT: 'Bên trái', RIGHT: 'Bên phải' }

const MINIMAL_NOTE = {
  staff: 'Xe được duyệt theo quy trình cũ nên chỉ có kết quả 5 nhóm và ảnh chung, không có chi tiết từng hạng mục.',
  public: 'Chứng nhận này hiển thị kết quả 5 nhóm tiêu chí và ảnh kiểm định chung.',
}

/**
 * Nội dung báo cáo chứng nhận, dùng chung cho trang quản trị và SCR-M05 công khai.
 *
 * @param {{
 *   report: import('../constants/cpoCertificateConstants').PublicInspectionReport,
 *   vehicleCode: string|null,
 *   audience?: 'staff'|'public',
 *   forPrint?: boolean,
 * }} props
 *   audience: "public" ẩn loại báo cáo nội bộ và dùng câu chữ cho khách.
 *   forPrint: ảnh tải ngay (không lazy) để bản in có đủ ảnh.
 */
export default function CertificateReportBody({ report, vehicleCode, audience = 'staff', forPrint = false }) {
  const overview =
    report.level === REPORT_LEVEL.FULL ? Object.entries(report.overviewPhotos || {}).filter(([, src]) => src) : []
  const minimal = report.level === REPORT_LEVEL.MINIMAL

  return (
    <div className={styles.reportBody}>
      <Card title="Thông tin xe xác nhận" size={forPrint ? 'small' : undefined}>
        <CertifiedVehicleInfo report={report} vehicleCode={vehicleCode} showLevel={audience === 'staff'} />
      </Card>

      {overview.length > 0 && (
        <Card title="Ảnh tổng quan" size={forPrint ? 'small' : undefined}>
          <div className={styles.overviewGrid}>
            {overview.map(([position, src]) => (
              <figure key={position} className={styles.overviewItem}>
                <PhotoGrid photos={[src]} alt={`Ảnh ${OVERVIEW_LABELS[position] || position}`} forPrint={forPrint} />
                <figcaption>{OVERVIEW_LABELS[position] || position}</figcaption>
              </figure>
            ))}
          </div>
        </Card>
      )}

      <Card title="Kết quả 5 nhóm kiểm định" size={forPrint ? 'small' : undefined}>
        {minimal && <Alert type="info" showIcon className={styles.minimalNote} title={MINIMAL_NOTE[audience]} />}
        <CertificateGroupResults groups={report.groups} level={report.level} forPrint={forPrint} />
      </Card>

      {minimal && report.photos.length > 0 && (
        <Card title="Ảnh kiểm định" size={forPrint ? 'small' : undefined}>
          <PhotoGrid photos={report.photos} alt="Ảnh kiểm định" forPrint={forPrint} />
        </Card>
      )}

      <p className={styles.scope}>{report.scopeNote}</p>
    </div>
  )
}
