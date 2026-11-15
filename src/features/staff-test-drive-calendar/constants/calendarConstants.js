// Hằng số của lịch lái thử cho nhân viên.
// Ref: .sdd/features/staff-test-drive-calendar/SPEC.md (CF2, CF6, CF7, CF12)

/** 4 khung cố định mỗi ngày (giờ VN). Lượt có giờ khác (dữ liệu cũ) vào khối `OTHER_SLOT`. */
export const SLOT_TIMES = Object.freeze(['08:00', '10:00', '13:00', '15:00'])
export const OTHER_SLOT = 'other'
export const OTHER_SLOT_LABEL = 'Giờ khác'

/** BE cắt mỗi trang tối đa 50 lượt (`MAX_PAGE_SIZE`); tải tối đa 16 trang (800 lượt) mỗi lần xem. */
export const PAGE_LIMIT = 50
export const MAX_PAGES = 16
export const MAX_VISITS = PAGE_LIMIT * MAX_PAGES

/** Số dòng lượt hiện trong một ô ngày của lưới tháng; phần còn lại là "+N lượt nữa". */
export const MAX_LINES_PER_DAY = 3

export const NARROW_QUERY = '(max-width: 640px)'

export const MODE = Object.freeze({ MONTH: 'month', WEEK: 'week' })

export const UNAVAILABLE_CAR_LABEL = 'Xe không còn bán'
