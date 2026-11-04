import { QR_ELIGIBLE_STATUSES, CERT_CAR_STATUS_LABEL } from '../constants/cpoCertificateConstants'

/**
 * Xe có được tạo QR không. Xe ngoài APPROVED_CPO/AVAILABLE không còn báo cáo công khai,
 * QR sẽ dẫn tới trang không tìm thấy, nên khoá nút và nêu lý do.
 *
 * @param {string} carStatus
 * @returns {{ eligible: boolean, reason: string|null }}
 */
export function getQrEligibility(carStatus) {
  if (QR_ELIGIBLE_STATUSES.includes(carStatus)) return { eligible: true, reason: null }
  const label = CERT_CAR_STATUS_LABEL[carStatus] || 'không xác định'
  return {
    eligible: false,
    reason: `Xe đang ở trạng thái "${label}" nên không còn báo cáo công khai. Chỉ tạo QR cho xe "Đạt CPO, chờ đăng bán" hoặc "Đang bán".`,
  }
}

/**
 * Tên file tải về theo mã CPO, ví dụ "CPO-20261103-0001.png".
 * Chỉ giữ ký tự an toàn cho tên file trên mọi hệ điều hành.
 *
 * @param {string} certificateId
 * @param {'png'|'svg'} extension
 */
export function buildQrFileName(certificateId, extension) {
  const safe = String(certificateId || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64)
  return `${safe || 'trustcar-qr'}.${extension}`
}
