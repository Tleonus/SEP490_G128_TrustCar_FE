import { Modal } from 'antd'
import { getCarTitle } from '../../../utils/car'
import QrCodePanel from './QrCodePanel'

/** Modal QR mở từ danh sách. @param {{ certificate: import('../constants/cpoCertificateConstants').CertificateListItem|null, onClose: () => void }} props */
export default function CertificateQrModal({ certificate, onClose }) {
  return (
    <Modal open={Boolean(certificate)} onCancel={onClose} footer={null} title="Mã QR chứng nhận" width={400} destroyOnHidden centered>
      {certificate && (
        <QrCodePanel
          publicCarKey={certificate.vehicleCode || certificate.carId}
          certificateId={certificate.certificateId}
          carStatus={certificate.carStatus}
          vehicleTitle={`${getCarTitle(certificate.vehicle)} ${certificate.vehicle?.year ?? ''}`.trim()}
        />
      )}
    </Modal>
  )
}
