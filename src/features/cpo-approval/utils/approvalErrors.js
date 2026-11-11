/**
 * KAN-56 – Dịch lỗi Backend/mạng sang thông báo tiếng Việt cho Admin.
 * Backend trả { success:false, message, code }; giữ `code` để xử lý nhánh.
 */

import { APPROVAL_ERROR_CODE } from '../constants/approvalConstants'

const MESSAGE_BY_CODE = {
  [APPROVAL_ERROR_CODE.INVALID_STATUS]: 'Xe không còn ở trạng thái "Đạt chuẩn CPO". Có thể đã được duyệt hoặc đổi trạng thái.',
  [APPROVAL_ERROR_CODE.CAR_NOT_FOUND]: 'Không tìm thấy xe. Xe có thể đã bị xoá.',
}

/** Mã lỗi Backend nếu có. */
export function errorCodeOf(error) {
  return error?.response?.data?.code || error?.code || null
}

/**
 * Thông báo tiếng Việt cho một lỗi bất kỳ.
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function approvalErrorMessage(error, fallback = 'Thao tác không thành công. Vui lòng thử lại.') {
  const status = error?.response?.status
  const code = errorCodeOf(error)

  if (code && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code]

  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Chỉ Quản trị viên mới được duyệt mở bán xe.'
  if (status === 404) return 'Không tìm thấy dữ liệu. Xe có thể đã bị xoá.'
  if (status === 409) return 'Trạng thái xe vừa thay đổi. Vui lòng tải lại danh sách.'
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng đợi trong giây lát.'
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'

  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
    return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'
  }

  return error?.response?.data?.message || fallback
}
