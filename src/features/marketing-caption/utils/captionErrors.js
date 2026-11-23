/**
 * KAN-69 / KAN-91 – Dịch lỗi của API caption và API đăng bài Facebook sang tiếng Việt.
 *
 * Mã lỗi Backend (KAN-68): CAR_NOT_FOUND, CAR_NOT_ADVERTISABLE, CAPTION_DAILY_LIMIT,
 * VALIDATION_ERROR. KAN-91 thêm nhóm FACEBOOK_* từ facebookPublishService.
 * Thông báo gốc của Backend là tiếng Anh nên không hiển thị thẳng.
 */

const MESSAGE_BY_CODE = {
  CAR_NOT_FOUND: 'Không tìm thấy xe. Xe có thể đã bị xoá.',
  CAR_NOT_ADVERTISABLE: 'Xe đang ở trạng thái không thể đăng bán. Chỉ xe đang bán, đã duyệt CPO hoặc đang giữ cọc mới tạo được caption.',
  CAPTION_DAILY_LIMIT: 'Hôm nay đã hết lượt gợi ý caption. Vui lòng thử lại vào ngày mai.',
  VALIDATION_ERROR: 'Thông tin gửi lên chưa hợp lệ. Chọn lại giọng điệu và độ dài giúp em.',
}

/** Lỗi riêng của thao tác đăng bài lên Facebook Page (KAN-91). */
const PUBLISH_MESSAGE_BY_CODE = {
  ...MESSAGE_BY_CODE,
  FACEBOOK_NOT_CONFIGURED: 'Backend chưa được cấu hình Facebook Page. Cần đặt FACEBOOK_PAGE_ID và FACEBOOK_PAGE_ACCESS_TOKEN trong .env của server rồi khởi động lại (xem docs/kan-91-facebook-graph-publish.md).',
  FACEBOOK_TOKEN_INVALID: 'Page Access Token đã hết hạn hoặc bị thu hồi. Tạo token dài hạn mới và cập nhật FACEBOOK_PAGE_ACCESS_TOKEN.',
  FACEBOOK_PERMISSION_DENIED: 'Token thiếu quyền đăng bài (cần pages_manage_posts) hoặc đang dùng User token thay vì Page token. Lấy Page token qua GET /me/accounts.',
  FACEBOOK_PAGE_NOT_ACCESSIBLE: 'FACEBOOK_PAGE_ID không phải một Facebook Page mà token này quản lý. Graph API không đăng được lên trang cá nhân — hãy dùng ID và Page token của Page TrustCar.',
  FACEBOOK_RATE_LIMIT: 'Facebook đang giới hạn tần suất đăng bài của Page. Vui lòng thử lại sau ít phút.',
  FACEBOOK_DAILY_LIMIT: 'Hôm nay đã đạt giới hạn đăng bài Facebook của TrustCar. Vui lòng thử lại vào ngày mai.',
  FACEBOOK_PUBLISH_FAILED: 'Facebook từ chối bài đăng. Kiểm tra lại caption và ảnh của xe rồi thử lại.',
  FACEBOOK_UNREACHABLE: 'Máy chủ Backend không kết nối được Facebook. Kiểm tra mạng của server rồi thử lại.',
  FACEBOOK_NO_IMAGE: 'Xe chưa có ảnh công khai để đăng. Thêm ảnh chính cho xe rồi thử lại.',
}

/** Mã lỗi Backend nếu có. */
export function captionErrorCode(error) {
  return error?.response?.data?.code || error?.code || null
}

/**
 * @param {unknown} error lỗi axios hoặc lỗi mạng
 * @param {string} [fallback]
 */
export function captionErrorMessage(error, fallback = 'Không tạo được caption. Vui lòng thử lại.') {
  const status = error?.response?.status
  const code = captionErrorCode(error)

  if (code && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code]

  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền tạo caption. Chỉ Admin và nhân viên bán hàng được dùng.'
  if (status === 404) return 'Backend chưa có API gợi ý caption. Cần triển khai KAN-68 trước.'
  if (status === 422) return MESSAGE_BY_CODE.VALIDATION_ERROR
  if (status === 429) return MESSAGE_BY_CODE.CAPTION_DAILY_LIMIT
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  if (error?.code === 'ECONNABORTED') return 'AI phản hồi quá lâu. Vui lòng bấm tạo lại.'
  if (error?.code === 'ERR_NETWORK') return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'

  return error?.response?.data?.message || fallback
}

/**
 * Dịch lỗi của POST /marketing/facebook/publish (KAN-91).
 * @param {unknown} error lỗi axios hoặc lỗi mạng
 */
export function publishErrorMessage(error) {
  const status = error?.response?.status
  const code = captionErrorCode(error)

  if (code && PUBLISH_MESSAGE_BY_CODE[code]) return PUBLISH_MESSAGE_BY_CODE[code]

  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Chỉ Admin được đăng bài lên Facebook Page.'
  if (status === 404) return 'Backend chưa có API đăng bài Facebook (KAN-91). Cần triển khai trước.'
  if (status === 422) return MESSAGE_BY_CODE.VALIDATION_ERROR
  if (status === 429) return PUBLISH_MESSAGE_BY_CODE.FACEBOOK_DAILY_LIMIT
  if (status === 503) return PUBLISH_MESSAGE_BY_CODE.FACEBOOK_NOT_CONFIGURED
  if (status >= 500) return 'Máy chủ đang gặp sự cố khi đăng bài. Vui lòng thử lại sau.'
  if (error?.code === 'ECONNABORTED') return 'Facebook phản hồi quá lâu. Kiểm tra lại bài đăng trên Page trước khi thử lại.'
  if (error?.code === 'ERR_NETWORK') return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'

  return error?.response?.data?.message || 'Không đăng được bài lên Facebook. Vui lòng thử lại.'
}
