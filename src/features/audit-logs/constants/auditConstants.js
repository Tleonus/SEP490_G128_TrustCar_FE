// Hằng số và nhãn tiếng Việt của trang "Nhật ký hoạt động".
// Ref: .sdd/features/system-audit-logs/SPEC.md (REQ-F03, REQ-F12, CF5, CF9) và API-AUDIT-LOGS v1.0.0 (BE)

export const PAGE_SIZE = 20

/**
 * KAN-92: nhãn tiếng Việt của nhóm hành động (BE suy ra từ mã sự kiện, xem `auditActions.js` của BE).
 * Thứ tự hiển thị lấy từ `/meta.actions`; mã lạ hiện nguyên mã.
 */
export const ACTION_LABELS = Object.freeze({
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  STATUS_CHANGE: 'Đổi trạng thái',
  AUTH: 'Đăng nhập / bảo mật',
  OTHER: 'Khác',
})

/** Màu thẻ (preset của antd `Tag`) cho từng nhóm hành động; mã lạ dùng màu mặc định. */
export const ACTION_COLORS = Object.freeze({
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  STATUS_CHANGE: 'orange',
  AUTH: 'purple',
  OTHER: 'default',
})

export const SYSTEM_ACTOR_LABEL = 'Hệ thống'
export const UNKNOWN_ACTOR_LABEL = '(không rõ email)'

/** Chuỗi dài hơn mức này bị cắt trong ô bảng/Drawer, kèm "Xem thêm". */
export const VALUE_PREVIEW_CHARS = 300
/** Giới hạn tuyệt đối khi đổi một giá trị thành chữ (chống nhật ký khổng lồ làm treo trang). */
export const VALUE_HARD_LIMIT = 20000
/** Độ sâu tối đa khi đổi đối tượng lồng nhau thành chữ. */
export const VALUE_MAX_DEPTH = 8

/**
 * Nhãn tiếng Việt của mã sự kiện đã biết (`ActivityEventType` của BE + `PROFILE_UPDATED`, `SETTINGS_UPDATED` của KAN-25).
 * Mã lạ hiển thị nguyên mã; bộ lọc luôn lấy danh sách mã từ `/meta`, không từ bảng này.
 */
export const EVENT_LABELS = Object.freeze({
  // Tài khoản và đăng nhập
  USER_LOGIN: 'Đăng nhập',
  USER_LOGOUT: 'Đăng xuất',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  ACCOUNT_LOCKED: 'Khóa tài khoản',
  PASSWORD_CHANGED: 'Đổi mật khẩu',
  PASSWORD_RESET: 'Đặt lại mật khẩu',
  CUSTOMER_REGISTERED: 'Khách hàng đăng ký',
  GOOGLE_LINKED: 'Liên kết tài khoản Google',
  PROFILE_COMPLETED: 'Hoàn tất hồ sơ',
  PROFILE_UPDATED: 'Cập nhật hồ sơ cá nhân',
  SETTINGS_UPDATED: 'Cập nhật cài đặt cá nhân',

  // Quản lý nhân viên
  USER_CREATED: 'Tạo tài khoản nhân viên',
  USER_UPDATED: 'Cập nhật tài khoản',
  USER_DEACTIVATED: 'Vô hiệu hóa tài khoản',
  USER_ACTIVATED: 'Kích hoạt tài khoản',

  // Xe
  CAR_CREATED: 'Tạo xe',
  CAR_UPDATED: 'Cập nhật xe',
  CAR_STATUS_CHANGED: 'Đổi trạng thái xe',
  CAR_PRICE_UPDATED: 'Cập nhật giá xe',
  CAR_IMAGE_ADDED: 'Thêm ảnh xe',
  CAR_IMAGE_REMOVED: 'Xóa ảnh xe',

  // Khách hàng và khách tiềm năng
  CUSTOMER_CREATED: 'Tạo khách hàng',
  CUSTOMER_UPDATED: 'Cập nhật khách hàng',
  LEAD_CREATED: 'Tạo khách tiềm năng',
  LEAD_STAGE_CHANGED: 'Đổi giai đoạn khách tiềm năng',
  LEAD_NOTE_ADDED: 'Thêm ghi chú khách tiềm năng',

  // Lịch lái thử
  APPOINTMENT_CREATED: 'Tạo lịch hẹn',
  APPOINTMENT_CONFIRMED: 'Xác nhận lịch hẹn',
  APPOINTMENT_CANCELLED: 'Hủy lịch hẹn',
  APPOINTMENT_COMPLETED: 'Hoàn tất lịch hẹn',
  APPOINTMENT_NO_SHOW: 'Khách vắng mặt',
  APPOINTMENT_RESCHEDULED: 'Đổi lịch hẹn',
  APPOINTMENT_REASSIGNED: 'Chuyển người phụ trách lịch hẹn',
  APPOINTMENT_NO_SHOW_CORRECTED: 'Sửa trạng thái vắng mặt',

  // Kiểm định
  INSPECTION_DRAFT_CREATED: 'Tạo bản nháp kiểm định',
  INSPECTION_SUBMITTED: 'Gửi biên bản kiểm định',

  // Xe yêu thích và cảnh báo giá
  CAR_SAVED_WISHLIST: 'Lưu xe yêu thích',
  CAR_REMOVED_WISHLIST: 'Bỏ xe yêu thích',
  WISHLIST_SYNCED: 'Đồng bộ danh sách yêu thích',
  PRICE_ALERT_SENT: 'Gửi cảnh báo giảm giá',
})
