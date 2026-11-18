/**
 * Dịch lỗi Backend/mạng khi thao tác ảnh xe sang tiếng Việt.
 */

const MESSAGE_BY_CODE = {
  CAR_NOT_FOUND: 'Không tìm thấy xe. Xe có thể đã bị xoá.',
  CAR_SOLD: 'Xe đã bán, không thể thay đổi ảnh.',
  IMAGE_NOT_FOUND: 'Không tìm thấy ảnh này. Có thể ảnh đã bị xoá.',
}

const MESSAGE_BY_STATUS = {
  400: 'Yêu cầu không hợp lệ.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền quản lý ảnh xe.',
  404: 'Không tìm thấy dữ liệu. Xe có thể đã bị xoá.',
  409: 'Xe đang ở trạng thái không cho phép thay đổi ảnh.',
  413: 'Ảnh vượt quá dung lượng cho phép (5 MB/ảnh).',
  415: 'Định dạng ảnh không được hỗ trợ. Chỉ nhận JPG, PNG, WEBP.',
  422: 'Dữ liệu gửi lên không hợp lệ.',
  429: 'Bạn thao tác quá nhanh. Vui lòng đợi trong giây lát.',
}

/**
 * @param {unknown} error lỗi axios
 * @param {string} [fallback]
 * @returns {string}
 */
export function carImageErrorMessage(error, fallback = 'Thao tác không thành công. Vui lòng thử lại.') {
  const status = error?.response?.status
  const code = error?.response?.data?.code

  if (code && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code]
  if (status && MESSAGE_BY_STATUS[status]) return MESSAGE_BY_STATUS[status]
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
    return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'
  }

  // Backend trả thông điệp tiếng Anh; chỉ dùng khi không map được mã lỗi nào.
  return fallback
}
