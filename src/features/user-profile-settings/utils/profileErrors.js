// Phân loại lỗi của API hồ sơ (`/profile`, `/profile/settings`) thành thông báo tiếng Việt và hành động giao diện.
// Thông báo không chứa dữ liệu cá nhân. BE là nguồn quyết định: FE chỉ dịch mã lỗi (SPEC mục 6).
// Ref: .sdd/features/user-profile-settings/SPEC.md (REQ-F03, F08–F12, F14)

export const PROFILE_ERROR = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  USER_GONE: 'USER_GONE',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  ROLE: 'ROLE',
  NO_PROFILE: 'NO_PROFILE',
  PHONE_TAKEN: 'PHONE_TAKEN',
  VALIDATION: 'VALIDATION',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
})

const K = PROFILE_ERROR
const LOGIN = Object.freeze({ label: 'Đăng nhập lại', to: '/dang-nhap' })
const COMPLETE = Object.freeze({ label: 'Hoàn tất hồ sơ', to: '/hoan-tat-ho-so' })

const PHONE_TAKEN_TEXT = 'Số điện thoại đã được dùng bởi tài khoản khác.'

/** Lỗi theo ô cho các trường BE có thể trả trong `errors[].field`. */
const FIELD_TEXT = Object.freeze({
  fullName: 'Họ tên không hợp lệ (2–100 ký tự).',
  phone: 'Số điện thoại không hợp lệ.',
  'address.street': 'Số nhà, đường không hợp lệ.',
  'address.district': 'Quận/huyện không hợp lệ.',
  'address.city': 'Thành phố không hợp lệ.',
  'address.province': 'Tỉnh không hợp lệ.',
  dateOfBirth: 'Ngày sinh không hợp lệ.',
  gender: 'Giới tính không hợp lệ.',
  marketingConsent: 'Giá trị cài đặt không hợp lệ.',
})

const result = (kind, message, extra = {}) => ({ kind, message, fieldErrors: {}, ...extra })

function fromValidation(errors) {
  const fieldErrors = {}
  let hasUnknown = false
  for (const item of Array.isArray(errors) ? errors : []) {
    if (FIELD_TEXT[item?.field]) fieldErrors[item.field] = FIELD_TEXT[item.field]
    else hasUnknown = true
  }
  const general = Object.keys(fieldErrors).length === 0 || hasUnknown
  return result(K.VALIDATION, general ? 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.' : 'Vui lòng sửa các ô được đánh dấu.', { fieldErrors })
}

function fromForbidden(code) {
  if (code === 'PROFILE_INCOMPLETE') {
    return result(K.PROFILE_INCOMPLETE, 'Bạn cần hoàn tất hồ sơ (họ tên, số điện thoại, mật khẩu) trước khi dùng mục này.', { action: COMPLETE })
  }
  return result(K.ROLE, 'Tài khoản của bạn không có mục này.')
}

function fromNotFound(code) {
  if (code === 'USER_NOT_FOUND') return result(K.USER_GONE, 'Không tìm thấy tài khoản. Vui lòng đăng nhập lại.', { action: LOGIN })
  return result(K.NO_PROFILE, 'Không tìm thấy hồ sơ khách hàng. Vui lòng liên hệ showroom.')
}

/**
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F03
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F08
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F09
 * @param {*} error Lỗi axios (hoặc bất kỳ lỗi nào).
 * @returns {{ kind: string, message: string, fieldErrors: Record<string,string>, action?: { label: string, to: string } }}
 */
export function classifyProfileError(error) {
  const response = error?.response
  if (!response) return result(K.NETWORK, 'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.')

  const { status, data } = response
  const code = data?.code
  if (status === 401) return result(K.UNAUTHORIZED, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', { action: LOGIN })
  if (status === 403) return fromForbidden(code)
  if (status === 404) return fromNotFound(code)
  if (status === 409 && code === 'PHONE_ALREADY_EXISTS') return result(K.PHONE_TAKEN, PHONE_TAKEN_TEXT, { fieldErrors: { phone: PHONE_TAKEN_TEXT } })
  if (status === 422) return fromValidation(data?.errors)
  if (status === 429) return result(K.RATE_LIMIT, 'Bạn thao tác quá nhanh, vui lòng thử lại sau.')
  return result(K.SERVER, 'Hệ thống đang bận, vui lòng thử lại.')
}
