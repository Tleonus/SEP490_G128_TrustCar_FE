/** Chuyển lỗi axios của API đặt cọc thành câu tiếng Việt cho người dùng. */
const MESSAGES = {
  DEPOSIT_CAR_NOT_FOUND: 'Không tìm thấy xe hoặc xe đã ngừng bán.',
  DEPOSIT_CAR_ALREADY_RESERVED: 'Rất tiếc, xe vừa được khách hàng khác giữ chỗ.',
  DEPOSIT_CAR_SOLD: 'Xe này đã được bán.',
  DEPOSIT_CAR_NOT_AVAILABLE: 'Xe hiện không mở đặt cọc.',
  DEPOSIT_CAR_PRICE_CHANGED: 'Giá xe vừa được cập nhật. Vui lòng xem lại và thử lại.',
  DEPOSIT_CAR_STATE_CONFLICT: 'Trạng thái xe đã bị thay đổi ngoài luồng đặt cọc. Vui lòng tải lại.',
  DEPOSIT_AMOUNT_INVALID: 'Số tiền không hợp lệ.',
  DEPOSIT_LIMIT_REACHED: 'Bạn đang giữ một xe khác. Vui lòng hủy hoặc hoàn tất lượt giữ đó trước.',
  DEPOSIT_USER_MISMATCH: 'Thông tin tài khoản không khớp. Vui lòng đăng nhập lại.',
  DEPOSIT_NOT_FOUND: 'Không tìm thấy lượt đặt cọc.',
  DEPOSIT_INVALID_STATE: 'Trạng thái đặt cọc đã thay đổi. Vui lòng tải lại.',
  DEPOSIT_EXPIRED: 'Lượt giữ xe đã hết hạn.',
  PROFILE_INCOMPLETE: 'Vui lòng hoàn tất hồ sơ (họ tên, số điện thoại) trước khi đặt cọc.',
  ROLE_INSUFFICIENT: 'Chỉ tài khoản khách hàng mới có thể đặt cọc.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  RATE_LIMIT_EXCEEDED: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  TOKEN_MISSING: 'Vui lòng đăng nhập để tiếp tục.',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  TOKEN_INVALID: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
}

export function depositErrorCode(error) {
  return error?.response?.data?.code || null
}

export function depositErrorMessage(error, fallback = 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.') {
  if (!error?.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.'
  const code = depositErrorCode(error)
  // Thông báo khoảng tiền / trạng thái cụ thể từ BE hữu ích hơn câu chung.
  if (['DEPOSIT_AMOUNT_INVALID', 'DEPOSIT_INVALID_STATE'].includes(code) && error.response.data?.message) {
    return error.response.data.message
  }
  return MESSAGES[code] || error.response.data?.message || fallback
}

/** Lỗi cho thấy trạng thái xe đã thay đổi → nên tải lại trạng thái giữ xe. */
export function isStaleStateError(error) {
  return [
    'DEPOSIT_CAR_ALREADY_RESERVED',
    'DEPOSIT_CAR_SOLD',
    'DEPOSIT_CAR_NOT_AVAILABLE',
    'DEPOSIT_CAR_PRICE_CHANGED',
    'DEPOSIT_CAR_STATE_CONFLICT',
    'DEPOSIT_INVALID_STATE',
    'DEPOSIT_EXPIRED',
  ].includes(depositErrorCode(error))
}
