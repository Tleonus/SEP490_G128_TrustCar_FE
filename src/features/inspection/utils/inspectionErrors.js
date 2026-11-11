/**
 * KAN-55 – Dịch lỗi Backend/mạng sang thông báo tiếng Việt cho nhân viên Sale.
 * Backend trả { success:false, message, code, errors? }; giữ `code` để xử lý nhánh,
 * chỉ dịch phần hiển thị.
 */

import { INSPECTION_ERROR_CODE } from '../constants/inspectionConstants'

const MESSAGE_BY_CODE = {
  [INSPECTION_ERROR_CODE.DRAFT_EXISTS]: 'Xe này đã có một biên bản kiểm định đang mở.',
  [INSPECTION_ERROR_CODE.LOCKED]: 'Biên bản đã được gửi và không thể chỉnh sửa nữa.',
  [INSPECTION_ERROR_CODE.NOT_FOUND]: 'Không tìm thấy biên bản kiểm định.',
  [INSPECTION_ERROR_CODE.CAR_NOT_FOUND]: 'Không tìm thấy xe.',
  [INSPECTION_ERROR_CODE.INVALID_CAR_STATUS]: 'Trạng thái hiện tại của xe không cho phép lập biên bản kiểm định.',
  [INSPECTION_ERROR_CODE.INCOMPLETE]: 'Biên bản chưa hoàn tất, chưa thể gửi.',
  [INSPECTION_ERROR_CODE.EVIDENCE_REQUIRED]: 'Nhân viên kiểm định phải đính kèm ít nhất một ảnh bằng chứng.',
  [INSPECTION_ERROR_CODE.MILEAGE_DECREASE]: 'Số km thực tế không được nhỏ hơn số km đang lưu trên hệ thống.',
  [INSPECTION_ERROR_CODE.VALIDATION_ERROR]: 'Dữ liệu gửi lên không hợp lệ.',
  [INSPECTION_ERROR_CODE.UPLOAD_NOT_CONFIGURED]: 'Hệ thống chưa cấu hình lưu trữ ảnh (Cloudinary). Báo quản trị viên.',
}

/** Lấy mã lỗi Backend nếu có. */
export function errorCodeOf(error) {
  return error?.response?.data?.code || error?.code || null
}

/** Danh sách lỗi chi tiết [{ field, message|code }] Backend gửi kèm (422/400). */
export function errorDetailsOf(error) {
  const details = error?.response?.data?.errors
  return Array.isArray(details) ? details : []
}

/**
 * Thông báo tiếng Việt cho một lỗi bất kỳ.
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function inspectionErrorMessage(error, fallback = 'Thao tác không thành công. Vui lòng thử lại.') {
  const status = error?.response?.status
  const code = errorCodeOf(error)

  if (code && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code]

  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác kiểm định này.'
  if (status === 404) return 'Không tìm thấy dữ liệu. Xe có thể đã bị xoá hoặc đổi mã.'
  if (status === 409) return error?.response?.data?.message || 'Trạng thái xe/biên bản vừa thay đổi. Vui lòng tải lại trang.'
  if (status === 413) return 'Dữ liệu gửi lên quá lớn.'
  if (status === 422) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu.'
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng đợi trong giây lát.'
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'

  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
    return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'
  }

  // Thông báo tiếng Anh của BE vẫn hữu ích cho kỹ thuật viên, giữ lại khi không dịch được.
  return error?.response?.data?.message || fallback
}

/** Lỗi 409 INSPECTION_DRAFT_EXISTS: xe đã có nháp đang mở. */
export function isDraftExistsError(error) {
  return errorCodeOf(error) === INSPECTION_ERROR_CODE.DRAFT_EXISTS
}

/** Lỗi 409 INSPECTION_LOCKED: biên bản đã gửi, chỉ xem. */
export function isLockedError(error) {
  return errorCodeOf(error) === INSPECTION_ERROR_CODE.LOCKED
}
