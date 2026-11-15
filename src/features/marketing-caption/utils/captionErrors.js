/**
 * KAN-69 – Dịch lỗi của POST /marketing/caption sang tiếng Việt.
 *
 * Mã lỗi Backend (KAN-68): CAR_NOT_FOUND, CAR_NOT_ADVERTISABLE, CAPTION_DAILY_LIMIT,
 * VALIDATION_ERROR. Thông báo gốc của Backend là tiếng Anh nên không hiển thị thẳng.
 */

const MESSAGE_BY_CODE = {
  CAR_NOT_FOUND: 'Không tìm thấy xe. Xe có thể đã bị xoá.',
  CAR_NOT_ADVERTISABLE: 'Xe đang ở trạng thái không thể đăng bán. Chỉ xe đang bán, đã duyệt CPO hoặc đang giữ cọc mới tạo được caption.',
  CAPTION_DAILY_LIMIT: 'Hôm nay đã hết lượt gợi ý caption. Vui lòng thử lại vào ngày mai.',
  VALIDATION_ERROR: 'Thông tin gửi lên chưa hợp lệ. Chọn lại giọng điệu và độ dài giúp em.',
}

/** Mã lỗi Backend nếu có. */
export function captionErrorCode(error) {
  return error?.response?.data?.code || error?.code || null
}

/**
 * @param {unknown} error lỗi axios hoặc lỗi mạng
 * @param {string} [fallback]
 */
export function captionErrorMessage(error, fallback = 'Không tạo được caption. Vui lòng thử lại.') {
  const status = error?.response?.status
  const code = captionErrorCode(error)

  if (code && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code]

  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền tạo caption. Chỉ Admin và nhân viên bán hàng được dùng.'
  if (status === 404) return 'Backend chưa có API gợi ý caption. Cần triển khai KAN-68 trước.'
  if (status === 422) return MESSAGE_BY_CODE.VALIDATION_ERROR
  if (status === 429) return MESSAGE_BY_CODE.CAPTION_DAILY_LIMIT
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  if (error?.code === 'ECONNABORTED') return 'AI phản hồi quá lâu. Vui lòng bấm tạo lại.'
  if (error?.code === 'ERR_NETWORK') return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'

  return error?.response?.data?.message || fallback
}
