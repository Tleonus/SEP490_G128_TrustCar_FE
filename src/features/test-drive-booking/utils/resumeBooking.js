// Khách chưa đăng nhập bấm "Đặt lịch lái thử": ghi nhớ xe vào đường dẫn quay lại (?datlich=<id xe>),
// đăng nhập xong quay về đúng trang đó và tự mở lại hộp đặt lịch cho xe đó.
// @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F02

export const RESUME_PARAM = 'datlich'

/** Đường dẫn quay lại (dạng `location` của react-router) kèm xe cần đặt lịch. */
export function resumeLocation(location, carId) {
  const params = new URLSearchParams(location.search)
  params.set(RESUME_PARAM, carId)
  return { pathname: location.pathname, search: `?${params.toString()}`, hash: location.hash || '' }
}

/** Id xe đang chờ đặt lịch trong đường dẫn hiện tại (hoặc null). */
export function pendingBookingId(search) {
  return new URLSearchParams(search).get(RESUME_PARAM)
}

/** Bỏ tham số chờ đặt lịch khỏi `search` (để tải lại trang không mở lại hộp thoại). */
export function withoutResume(search) {
  const params = new URLSearchParams(search)
  params.delete(RESUME_PARAM)
  const s = params.toString()
  return s ? `?${s}` : ''
}

/**
 * Trang đích sau khi đăng nhập: đúng trang khách đang xem (giữ ?query). Chỉ nhận đường dẫn nội bộ
 * (bắt đầu bằng "/", không phải "//") để không bị chuyển hướng ra trang ngoài.
 */
export function loginDestination(from, fallback = '/') {
  const path = from?.pathname
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return fallback
  return `${path}${from.search || ''}${from.hash || ''}`
}
