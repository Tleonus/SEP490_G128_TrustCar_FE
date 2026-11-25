// Hằng số và nhãn tiếng Việt của tính năng dịch vụ showroom (KAN-96).
// Ref: BE docs/KAN-96-showroom-service.md.

export const SERVICE_PLATE_MIN = 5
export const SERVICE_PLATE_MAX = 15
export const SERVICE_NOTES_MAX = 500
export const SERVICE_SLOT_DAYS = 14

/** Vì sao khung giờ không chọn được (BE trả reason). */
export const SERVICE_SLOT_REASON_LABEL = Object.freeze({
  TOO_SOON: 'Quá gần giờ',
  TOO_FAR: 'Chưa mở đặt',
  CAPACITY_FULL: 'Đã kín chỗ',
  ALREADY_BOOKED: 'Bạn đã đặt khung này',
  PAST: 'Đã qua',
})

/** Trạng thái lịch dịch vụ (BE: AppointmentStatus). */
export const SERVICE_STATUS = Object.freeze({
  PENDING: { label: 'Chờ xác nhận', color: 'blue' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'green' },
  COMPLETED: { label: 'Đã hoàn tất', color: 'blue' },
  NO_SHOW: { label: 'Vắng mặt', color: 'red' },
  CANCELLED: { label: 'Đã hủy', color: 'default' },
})

/** Biển số: viết hoa, cho phép chữ cái, số, '.', '-'. */
export const SERVICE_PLATE_REGEX = /^[A-Z0-9.\-]{5,15}$/
