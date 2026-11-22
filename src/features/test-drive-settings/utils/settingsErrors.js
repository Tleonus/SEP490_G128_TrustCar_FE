// Chuyển lỗi API cấu hình thành câu tiếng Việt mà quản trị viên có thể hành động theo.
const MESSAGE_BY_STATUS = {
  401: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  403: 'Tài khoản của bạn không có quyền thực hiện thao tác này.',
  429: 'Bạn thao tác quá nhanh. Hãy thử lại sau ít phút.',
}

export function getSettingsErrorMessage(error, fallback = 'Máy chủ đang gặp lỗi. Hãy thử lại sau.') {
  // Không có phản hồi nghĩa là chưa tới được máy chủ; có phản hồi lạ thì không phải lỗi mạng.
  if (!error?.response) return 'Không thể kết nối máy chủ. Hãy kiểm tra mạng rồi thử lại.'
  const { code, errors } = error.response.data ?? {}
  // Lỗi kiểm tra cấu hình trả chi tiết theo từng trường trong mảng errors.
  if (code === 'VALIDATION_ERROR' && Array.isArray(errors) && errors[0]?.message) return errors[0].message
  return MESSAGE_BY_STATUS[error.response.status] ?? fallback
}
