import { useMemo, useState } from 'react'
import { Alert, App, Button, Skeleton, Typography } from 'antd'
import { CopyOutlined, DownloadOutlined, LockOutlined, PrinterOutlined } from '@ant-design/icons'
import { buildPublicCarUrl, getConfiguredPublicBaseUrl } from '../utils/qrTargetUrl'
import { buildQrFileName, getQrEligibility } from '../utils/qrEligibility'
import { copyText, downloadFile } from '../utils/qrEngine'
import { useQrCode } from '../hooks/useQrCode'
import CertificatePrintLabel from './CertificatePrintLabel'
import styles from '../styles/QrCodePanel.module.css'

/**
 * Module QR dùng chung: xem trước, tải PNG/SVG, sao chép liên kết, in tem.
 * QR chứa URL trang chi tiết xe công khai: {PUBLIC_BASE_URL}/xe/{publicCarKey}.
 *
 * @param {{ publicCarKey: string, certificateId: string, carStatus: string, vehicleTitle?: string }} props
 *   publicCarKey: mã xe (TC-...) hoặc ObjectId; trang công khai nhận cả hai.
 */
export default function QrCodePanel({ publicCarKey, certificateId, carStatus, vehicleTitle = '' }) {
  const { message } = App.useApp()
  const [printing, setPrinting] = useState(false)
  const { eligible, reason } = getQrEligibility(carStatus)
  const targetUrl = useMemo(
    () => (eligible ? buildPublicCarUrl({ baseUrl: getConfiguredPublicBaseUrl(), carId: publicCarKey }) : null),
    [eligible, publicCarKey],
  )
  const qr = useQrCode(targetUrl)
  const ready = Boolean(targetUrl && qr.pngDataUrl && qr.svg)

  async function handleCopy() {
    try {
      await copyText(targetUrl)
      message.success('Đã sao chép liên kết.')
    } catch {
      message.error('Trình duyệt không cho phép sao chép. Hãy chọn và sao chép liên kết thủ công.')
    }
  }

  if (!eligible) {
    return (
      <div className={styles.panel}>
        <div className={styles.locked} aria-hidden="true">
          <LockOutlined />
        </div>
        <Alert type="info" showIcon title="Không thể tạo mã QR" description={reason} />
        <Actions disabled />
      </div>
    )
  }

  if (!targetUrl) {
    return (
      <div className={styles.panel}>
        <Alert
          type="error"
          showIcon
          title="Cấu hình địa chỉ công khai không hợp lệ"
          description="Kiểm tra biến VITE_PUBLIC_BASE_URL (phải bắt đầu bằng http:// hoặc https://)."
        />
        <Actions disabled />
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.preview}>
        {qr.loading && <Skeleton.Image active className={styles.qrSkeleton} />}
        {qr.error && <Alert type="error" showIcon title={qr.error} />}
        {ready && <img src={qr.svgDataUrl} alt={`Mã QR của chứng nhận ${certificateId}`} className={styles.qrImage} />}
      </div>
      <div className={styles.code}>{certificateId}</div>
      <Typography.Paragraph className={styles.url} copyable={false} ellipsis={{ rows: 2, tooltip: targetUrl }}>
        {targetUrl}
      </Typography.Paragraph>
      {/* Trang xe công khai chỉ hiện xe "Đang bán": QR của xe chưa đăng bán tạm thời dẫn tới trang không tìm thấy. */}
      {carStatus === 'APPROVED_CPO' && (
        <Alert
          type="warning"
          showIcon
          title="Xe chưa đăng bán"
          description='Mã QR chỉ mở được trang xe sau khi xe chuyển sang "Đang bán". Chỉ in tem sau khi đăng bán.'
        />
      )}
      <Actions
        disabled={!ready}
        onPng={() => downloadFile(qr.pngDataUrl, buildQrFileName(certificateId, 'png'))}
        onSvg={() => downloadFile(new Blob([qr.svg], { type: 'image/svg+xml' }), buildQrFileName(certificateId, 'svg'))}
        onCopy={handleCopy}
        onPrint={() => setPrinting(true)}
      />
      {printing && ready && (
        <CertificatePrintLabel
          qrSvgDataUrl={qr.svgDataUrl}
          certificateId={certificateId}
          vehicleTitle={vehicleTitle}
          onDone={() => setPrinting(false)}
        />
      )}
    </div>
  )
}

function Actions({ disabled, onPng, onSvg, onCopy, onPrint }) {
  return (
    <div className={styles.actions}>
      <Button icon={<DownloadOutlined />} disabled={disabled} onClick={onPng} className={styles.action}>
        Tải PNG
      </Button>
      <Button icon={<DownloadOutlined />} disabled={disabled} onClick={onSvg} className={styles.action}>
        Tải SVG
      </Button>
      <Button icon={<CopyOutlined />} disabled={disabled} onClick={onCopy} className={styles.action}>
        Sao chép liên kết
      </Button>
      <Button type="primary" icon={<PrinterOutlined />} disabled={disabled} onClick={onPrint} className={styles.action}>
        In tem
      </Button>
    </div>
  )
}
