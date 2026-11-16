// Hằng số của biểu mẫu phản hồi lái thử và khuôn chuỗi `outcome` (phiên bản 1).
// Ref: .sdd/features/test-drive-feedback-form/SPEC.md mục 5
// Nhãn KHÔNG được chứa dấu phẩy hoặc xuống dòng (chuỗi nối bằng ", " và tách theo dòng).

export const FEEDBACK_HEADER = 'Phản hồi lái thử'

// Thứ tự khai báo = thứ tự các dòng trong chuỗi.
export const KEYS = Object.freeze({
  rating: 'Đánh giá',
  interest: 'Quan tâm',
  likes: 'Thích',
  concerns: 'Lo ngại',
  next: 'Tiếp theo',
  notes: 'Ghi chú',
})

export const KEY_ORDER = Object.freeze(['rating', 'interest', 'likes', 'concerns', 'next', 'notes'])

export const RATINGS = Object.freeze([1, 2, 3, 4, 5])
export const RATING_MAX = 5

export const INTERESTS = Object.freeze(['Nóng', 'Ấm', 'Lạnh'])

export const LIKES = Object.freeze([
  'Vận hành', 'Nội thất', 'Ngoại thất', 'Tiện nghi', 'An toàn', 'Giá hợp lý',
])

export const CONCERNS = Object.freeze([
  'Giá', 'Số km / đời xe', 'Tình trạng xe', 'Chi phí bảo dưỡng', 'Vay trả góp',
])

export const NEXT_STEPS = Object.freeze([
  'Hẹn xem lại', 'Gửi báo giá', 'Hỗ trợ vay trả góp', 'Cân nhắc thêm', 'Không mua',
])

export const EMPTY_FEEDBACK = Object.freeze({
  rating: null,
  interest: '',
  likes: Object.freeze([]),
  concerns: Object.freeze([]),
  next: '',
  notes: '',
})

export const LIST_SEPARATOR = ', '
export const LINE_BREAK = '\n'
export const NOTES_PREFIX = `${KEYS.notes}: `
