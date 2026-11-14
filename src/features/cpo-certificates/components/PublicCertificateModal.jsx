import { useState } from 'react'
import { Button, Modal } from 'antd'
import { PrinterOutlined, SafetyCertificateFilled } from '@ant-design/icons'
import { formatDate } from '../../../utils/format'
import CertificateReportBody from './CertificateReportBody'
import PrintPortal from './PrintPortal'
import styles from '../styles/PublicCertificate.module.css'

function CertificateHeading({ report }) {
  return (
    <div className={styles.modalHeading}>
      <span className={styles.badge}>
        <SafetyCertificateFilled /> TrustCar Certified
      </span>
      <span className={styles.modalCode}>{report.certificateId}</span>
      <span className={styles.modalIssued}>Cấp ngày {formatDate(report.issuedAt)}</span>
    </div>
  )
}

/**
 * SCR-M05: chứng nhận điện tử của xe trong modal, có nút in (window.print + stylesheet in riêng).
 *
 * @param {{ open: boolean, onClose: () => void, report: object, vehicleCode: string|null }} props
 */
export default function PublicCertificateModal({ open, onClose, report, vehicleCode }) {
  const [printing, setPrinting] = useState(false)

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        title={<CertificateHeading report={report} />}
        width={880}
        centered
        destroyOnHidden
        footer={
          <div className={styles.modalFooter}>
            <Button size="large" onClick={onClose} className={styles.touch}>
              Đóng
            </Button>
            <Button
              size="large"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => setPrinting(true)}
              className={styles.touch}
            >
              In chứng nhận
            </Button>
          </div>
        }
      >
        <CertificateReportBody report={report} vehicleCode={vehicleCode} audience="public" />
      </Modal>

      {printing && (
        <PrintPortal onDone={() => setPrinting(false)}>
          <div className="cpo-print-report">
            <CertificateHeading report={report} />
            <CertificateReportBody report={report} vehicleCode={vehicleCode} audience="public" forPrint />
          </div>
        </PrintPortal>
      )}
    </>
  )
}
