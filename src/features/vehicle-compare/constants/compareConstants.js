// Hằng số của tính năng so sánh xe.
// Ref: .sdd/features/vehicle-comparison/SPEC.md (REQ-F01, REQ-F04, REQ-F05)

/** Số xe tối đa / tối thiểu để so sánh. */
export const MAX_COMPARE = 3
export const MIN_COMPARE = 2

/** Khóa lưu danh sách chọn trong localStorage. */
export const COMPARE_STORAGE_KEY = 'trustcar_compare'

/** Đường dẫn trang so sánh. */
export const COMPARE_PATH = '/so-sanh'

/** Id xe hợp lệ của BE: ObjectId 24 ký tự hex. */
export const COMPARE_ID_REGEX = /^[0-9a-f]{24}$/i

/** Thông báo khi chọn quá số xe tối đa. */
export const COMPARE_FULL_MESSAGE = `Chỉ so sánh tối đa ${MAX_COMPARE} xe. Hãy bỏ bớt một xe.`
