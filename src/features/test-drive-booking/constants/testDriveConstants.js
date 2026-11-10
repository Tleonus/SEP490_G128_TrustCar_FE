// Hằng số và nhãn tiếng Việt của tính năng đặt lịch lái thử.
// Ref: .sdd/features/test-drive-booking/SPEC.md (mục 5, 6) và API-TEST-DRIVE-BOOKING v1.0.0 (BE)

export const MAX_CARS = 3
export const SLOT_DAYS = 14
export const NOTES_MAX = 500
export const REASON_MAX = 500
export const OUTCOME_MAX = 1000
export const LATE_CANCEL_HOURS = 12
export const SEARCH_MIN_CHARS = 2
export const SEARCH_DEBOUNCE_MS = 400
export const SEARCH_LIMIT = 8
/** Số xe lấy từ API trước khi lọc lại theo mọi từ khóa (API chỉ khớp từng trường riêng lẻ). */
export const SEARCH_FETCH_LIMIT = 20

/** Id xe hợp lệ của BE (24 ký tự hex). Xe dữ liệu mẫu không có id dạng này. */
export const CAR_ID_REGEX = /^[0-9a-f]{24}$/i

/** Trạng thái lượt (BE suy ra từ các lịch con). */
export const VISIT_STATUS = Object.freeze({
  PENDING: { label: 'Chờ xác nhận', color: 'gold' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'green' },
  COMPLETED: { label: 'Đã hoàn tất', color: 'blue' },
  NO_SHOW: { label: 'Vắng mặt', color: 'red' },
  CANCELLED: { label: 'Đã hủy', color: 'default' },
})

/** Vì sao một khung không đặt được (GET /slots → reason). */
export const SLOT_REASON_LABEL = Object.freeze({
  TOO_SOON: 'Quá gần giờ',
  TOO_FAR: 'Chưa mở đặt',
  CAR_BOOKED: 'Xe đã có lịch',
  CAPACITY_FULL: 'Đã kín chỗ',
  ALREADY_BOOKED: 'Bạn đã đặt khung này',
  PAST: 'Đã qua',
})

/** Nguyên nhân hủy (BE: cancellationType). */
export const CANCELLATION_TEXT = Object.freeze({
  CUSTOMER: 'Bạn đã hủy lượt này',
  STAFF: 'Showroom đã hủy lượt này',
  CAR_UNAVAILABLE: 'Xe không còn bán nên lịch được hủy tự động. Showroom sẽ liên hệ với bạn.',
})

export const LATE_CANCEL_LABEL = 'Hủy sát giờ'
export const CAR_UNAVAILABLE_NOTE = 'Xe đã ngừng bán, lịch của xe này đã tự hủy'

/** Trạng thái hiện tại của xe (nhân viên xem). */
export const CAR_STATUS_LABEL = Object.freeze({
  DRAFT: 'Nháp',
  UNDER_INSPECTION: 'Đang kiểm định',
  APPROVED_CPO: 'Đã đạt CPO',
  REJECTED: 'Không đạt',
  INCOMING: 'Sắp về',
  MAINTENANCE: 'Bảo dưỡng',
  AVAILABLE: 'Đang bán',
  RESERVED: 'Đã giữ chỗ',
  SOLD: 'Đã bán',
  DELISTED: 'Ngừng bán',
})

/** Nguyên nhân hủy nhìn từ phía nhân viên. */
export const STAFF_CANCELLATION_TEXT = Object.freeze({
  CUSTOMER: 'Khách hủy',
  STAFF: 'Nhân viên hủy',
  CAR_UNAVAILABLE: 'Tự hủy: xe không còn bán (cần gọi báo khách)',
})

export const STAFF_PAGE_SIZE = 20

export const STAFF_ACTION_LABEL = Object.freeze({
  CONFIRMED: 'Xác nhận',
  CANCELLED: 'Hủy lượt',
  COMPLETED: 'Hoàn tất',
  NO_SHOW: 'Vắng mặt',
  RESCHEDULE: 'Đổi lịch',
})

// ---- 1.1.0 (SPEC FE v1.1.0, API-TEST-DRIVE-BOOKING v1.1.0) ----

/** Hằng số phản chiếu BE, CHỈ để chọn câu giải thích (FA11). Quyết định thật là `canReschedule` của BE. */
export const RESCHEDULE_MIN_HOURS = 12
export const MAX_RESCHEDULES = 2

/** Ghi chú nội bộ khi nhân viên hủy (G2). */
export const NOTE_MAX = 300
export const REFRESH_MIN_INTERVAL_MS = 30 * 1000
export const CUSTOMER_SEARCH_MIN_CHARS = 3
export const CUSTOMER_SEARCH_LIMIT = 10

/** Lý do hủy nhân viên chọn sẵn (G2). Mã gửi cho BE; nhãn khách thấy do BE trả, FE không tự dịch. */
export const STAFF_CANCEL_REASONS = Object.freeze([
  { code: 'CUSTOMER_WILL_NOT_COME', label: 'Khách báo không đến' },
  { code: 'SHOWROOM_BUSY', label: 'Showroom có việc đột xuất' },
  { code: 'CUSTOMER_CHANGED_MIND', label: 'Khách đổi ý' },
  { code: 'OTHER', label: 'Khác (phải ghi lý do)' },
])
export const CANCEL_REASON_OTHER = 'OTHER'

export const REMINDER_LABEL = 'Gọi nhắc'
export const OUTCOME_LABEL = 'Cần chốt kết quả'
export const CURRENT_SLOT_LABEL = 'Giờ hiện tại'
export const RESCHEDULE_TITLE = 'Đổi lịch'

/** Lý do khung không chọn được ở lưới của nhân viên (GET /appointments/slots → reason). */
export const STAFF_SLOT_REASON_LABEL = Object.freeze({
  PAST: 'Đã qua',
  CAR_BOOKED: 'Xe đã có lịch',
  CAPACITY_FULL: 'Đã kín chỗ',
})

export const RESCHEDULE_HINT = Object.freeze({
  MAX_REACHED: 'Bạn đã đổi lịch tối đa 2 lần. Cần đổi tiếp xin gọi showroom.',
  TOO_LATE: 'Còn dưới 12 giờ nên không tự đổi lịch được. Xin gọi showroom.',
  OTHER: 'Lượt này hiện chưa tự đổi lịch được. Xin gọi showroom.',
})

// ---- 1.2.0 (SPEC FE v1.2.0, API-TEST-DRIVE-BOOKING 1.2.0) ----

/** Nhãn dòng được BE ghim (lượt chờ xác nhận, hoặc lượt nhân viên vừa đổi/đặt hộ hôm nay). */
export const PIN_LABEL = 'Cần xử lý'
/** Tự tải ngầm danh sách nhân viên mỗi 60 giây (G10); gặp 429 thì dừng 5 phút. */
export const AUTO_REFRESH_MS = 60 * 1000
export const AUTO_REFRESH_PAUSE_MS = 5 * 60 * 1000
export const SORT_OPTIONS = Object.freeze([
  { label: 'Gần nhất trước', value: 'asc' },
  { label: 'Mới nhất trước', value: 'desc' },
])
