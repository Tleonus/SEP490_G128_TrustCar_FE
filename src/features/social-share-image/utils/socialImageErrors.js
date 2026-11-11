/**
 * KAN-66 – Dịch lỗi Backend/mạng sang thông báo tiếng Việt.
 */

const MESSAGE_BY_CODE = {
  CAR_NOT_FOUND: 'Không tìm thấy xe. Xe có thể đã bị xoá.',
  CAR_SOLD: 'Xe đã bán, không thể thay đổi ảnh.',
  TOO_MANY_IMAGES: 'Xe đã đủ 20 ảnh, không thể tải thêm.',
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
export function socialImageErrorMessage(error, fallback = 'Thao tác không thành công. Vui lòng thử lại.') {
  const status = error?.response?.status
  const code = errorCodeOf(error)

  if (code && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code]

  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền quản lý ảnh xe.'
  if (status === 404) return 'Không tìm thấy dữ liệu. Xe có thể đã bị xoá hoặc API chưa được Backend triển khai.'
  if (status === 413) return 'Ảnh vượt quá dung lượng cho phép (5 MB/ảnh).'
  if (status === 415) return 'Định dạng ảnh không được hỗ trợ. Chỉ nhận JPG, PNG, WEBP.'
  if (status === 422) return 'Dữ liệu gửi lên không hợp lệ.'
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng đợi trong giây lát.'
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'

  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
    return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'
  }

  return error?.response?.data?.message || fallback
}
