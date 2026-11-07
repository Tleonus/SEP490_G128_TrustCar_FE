// Chuyển mã lỗi của API lái thử thành câu tiếng Việt mà người dùng có thể hành động theo.
const MESSAGE_BY_CODE = {
  PROFILE_INCOMPLETE: 'Bạn cần hoàn tất hồ sơ để sử dụng tính năng lái thử.',
  CAR_NOT_BOOKABLE: 'Xe này hiện không nhận lịch lái thử.',
  SLOT_FULL: 'Khung giờ này vừa hết chỗ. Hãy chọn khung giờ khác.',
  CAR_SLOT_TAKEN: 'Xe đã có lịch trong khung giờ này. Hãy chọn khung giờ khác.',
  INVALID_SLOT: 'Khung giờ không còn hợp lệ. Hãy chọn lại.',
  SCHEDULE_OUT_OF_WINDOW: 'Chỉ đặt được lịch trước ít nhất 2 giờ và không quá 60 ngày.',
  ACTIVE_BOOKING_LIMIT: 'Bạn đã có 2 lịch sắp diễn ra. Hãy hoàn tất hoặc hủy bớt trước khi đặt thêm.',
  CAR_BOOKING_LIMIT: 'Bạn đã có một lịch sắp diễn ra với xe này.',
  DAILY_BOOKING_LIMIT: 'Bạn đã đặt 3 lần trong hôm nay, tính cả lịch đã hủy. Hãy thử lại vào ngày mai.',
  COMPLETED_LIMIT: 'Bạn đã lái thử 3 lần trong 30 ngày qua nên chưa thể đặt thêm.',
  TOO_MANY_REQUESTS: 'Bạn thao tác quá nhanh. Hãy thử lại sau ít phút.',
  STAFF_INVALID: 'Người được chọn không phải nhân viên bán hàng đang hoạt động.',
  STAFF_NOT_AVAILABLE: 'Nhân viên này đã có lịch trùng giờ. Hãy chọn người khác.',
  INVALID_TRANSITION: 'Lịch đã thay đổi nên không thể thực hiện thao tác này.',
  TEST_DRIVE_NOT_FOUND: 'Không tìm thấy lịch lái thử này.',
}

const MESSAGE_BY_STATUS = {
  401: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  403: 'Tài khoản của bạn không có quyền thực hiện thao tác này.',
  429: MESSAGE_BY_CODE.TOO_MANY_REQUESTS,
}

const CONFLICT_CODES = ['INVALID_TRANSITION', 'TEST_DRIVE_NOT_FOUND']

export function getErrorCode(error) {
  return error?.response?.data?.code
}

/** Dữ liệu trên màn hình đã cũ: người khác hoặc hệ thống vừa xử lý lịch này. */
export function isStaleAppointmentError(error) {
  return CONFLICT_CODES.includes(getErrorCode(error))
}

export function getNearestSlots(error) {
  return error?.response?.data?.errors?.nearestSlots ?? []
}

export function isProfileIncompleteError(error) {
  return getErrorCode(error) === 'PROFILE_INCOMPLETE'
}

export function getTestDriveErrorMessage(error, fallback = 'Máy chủ đang gặp lỗi. Hãy thử lại sau.') {
  // Không có phản hồi nghĩa là chưa tới được máy chủ; có phản hồi lạ thì không phải lỗi mạng.
  if (!error?.response) return 'Không thể kết nối máy chủ. Hãy kiểm tra mạng rồi thử lại.'
  const { code, errors } = error?.response?.data ?? {}
  if (code === 'BOOKING_LOCKED') {
    const until = errors?.lockedUntil
      ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date(errors.lockedUntil))
      : null
    return `Tài khoản tạm khóa đặt lịch online do không đến 2 lần${until ? `, mở lại lúc ${until}` : ''}.`
  }
  // Lỗi kiểm tra cấu hình trả chi tiết theo từng trường trong mảng errors.
  if (code === 'VALIDATION_ERROR' && Array.isArray(errors) && errors[0]?.message) return errors[0].message
  return MESSAGE_BY_CODE[code] ?? MESSAGE_BY_STATUS[error?.response?.status] ?? fallback
}
