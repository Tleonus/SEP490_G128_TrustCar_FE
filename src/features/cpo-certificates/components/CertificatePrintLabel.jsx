import { SafetyCertificateFilled } from '@ant-design/icons'
import { CERT_SCOPE_LINE } from '../constants/cpoCertificateConstants'
import PrintPortal from './PrintPortal'

/**
 * Tem in chứng nhận: QR (SVG vector), mã CPO, huy hiệu TrustCar Certified, dòng phạm vi.
 *
 * @param {{ qrSvgDataUrl: string, certificateId: string, vehicleTitle: string, onDone: () => void }} props
 */
export default function CertificatePrintLabel({ qrSvgDataUrl, certificateId, vehicleTitle, onDone }) {
  return (
    <PrintPortal onDone={onDone}>
      <div className="cpo-print-label">
        <div className="cpo-print-badge">
          <SafetyCertificateFilled />
          <span>TrustCar Certified</span>
        </div>
        <img className="cpo-print-qr" src={qrSvgDataUrl} alt="" />
        <div className="cpo-print-code">{certificateId}</div>
        {vehicleTitle && <div className="cpo-print-vehicle">{vehicleTitle}</div>}
        <div className="cpo-print-hint">Quét mã để xem xe và báo cáo kiểm định</div>
        <div className="cpo-print-scope">{CERT_SCOPE_LINE}</div>
      </div>
    </PrintPortal>
  )
}
