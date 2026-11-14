export const TEST_DRIVE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
})

export const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Đã hoàn thành',
  NO_SHOW: 'Khách không đến',
  CANCELLED: 'Đã hủy',
}

export const STATUS_COLOR = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  COMPLETED: 'green',
  NO_SHOW: 'red',
  CANCELLED: 'default',
}

export const ATTENTION_INFO = {
  PENDING_OVERDUE: {
    label: 'Quá giờ, chưa xác nhận',
    help: 'Không thể xác nhận nữa. Hãy liên hệ khách rồi hủy lịch nếu buổi hẹn không diễn ra.',
  },
  CAR_ON_HOLD: {
    label: 'Xe đang giữ chỗ hoặc bảo dưỡng',
    help: 'Lịch vẫn được giữ. Nhân viên quyết định tiếp tục hay hủy với lý do xe không sẵn sàng.',
  },
  STAFF_INACTIVE: {
    label: 'Nhân viên không còn hoạt động',
    help: 'Hãy đổi lịch này sang một nhân viên đang làm việc.',
  },
}

// Nội dung lý do trùng với TEST_DRIVE_CANCEL_TEXT của BE vì khách sẽ thấy đúng câu này.
export const CANCEL_REASONS = [
  { value: 'SLOT_FULL', label: 'Khung giờ đã hết chỗ' },
  { value: 'OVER_CAPACITY', label: 'Showroom quá số lượng khách trong khung giờ này' },
  { value: 'CAR_UNAVAILABLE', label: 'Xe không còn sẵn sàng để lái thử' },
  { value: 'OTHER', label: 'Lý do khác' },
]

export const CAR_STATUS_TEXT = {
  AVAILABLE: 'Đang bán',
  RESERVED: 'Đang giữ chỗ',
  MAINTENANCE: 'Đang bảo dưỡng',
  INCOMING: 'Sắp về',
  SOLD: 'Đã bán',
  DELISTED: 'Ngừng bán',
}

export const MANAGEMENT_PAGE_SIZE = 50
export const MY_TEST_DRIVES_PAGE_SIZE = 10
export const BOOKING_WINDOW_DAYS = 60
export const BOOKING_MIN_LEAD_HOURS = 2

export const ACTION_SUCCESS_MESSAGE = {
  confirm: 'Đã xác nhận lịch',
  complete: 'Đã ghi kết quả cho lịch',
  correct: 'Đã sửa kết quả cho lịch',
  noShow: 'Đã ghi nhận khách không đến lịch',
  reassign: 'Đã đổi nhân viên cho lịch',
  cancel: 'Đã hủy lịch',
}
