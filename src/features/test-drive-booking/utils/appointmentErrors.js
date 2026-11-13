// Phân loại lỗi của API đặt lịch lái thử thành thông báo tiếng Việt + hành động giao diện cần làm.
// Ref: .sdd/features/test-drive-booking/SPEC.md (mục 6) và API-TEST-DRIVE-BOOKING (BE Spec mục 6)

export const APPOINTMENT_ERROR = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  ROLE: 'ROLE',
  VALIDATION: 'VALIDATION',
  SLOT_INVALID: 'SLOT_INVALID',
  DUPLICATE: 'DUPLICATE',
  LIMIT: 'LIMIT',
  CONFLICT: 'CONFLICT',
  CAPACITY: 'CAPACITY',
  CAR_GONE: 'CAR_GONE',
  NOT_FOUND: 'NOT_FOUND',
  CANCELLED_ALREADY: 'CANCELLED_ALREADY',
  STATUS_INVALID: 'STATUS_INVALID',
  CAR_UNAVAILABLE: 'CAR_UNAVAILABLE',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK: 'NETWORK',
  // 1.1.0
  RESCHEDULE_NOT_ALLOWED: 'RESCHEDULE_NOT_ALLOWED',
  RESCHEDULE_LIMIT: 'RESCHEDULE_LIMIT',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
})

const K = APPOINTMENT_ERROR
const LOGIN = { label: 'Đăng nhập', to: '/dang-nhap' }
const PROFILE = { label: 'Hoàn tất hồ sơ', to: '/hoan-tat-ho-so' }
const MY_VISITS = { label: 'Xem lịch hẹn của tôi', to: '/lich-hen' }

/** code của BE → kind (status 401/403/429 được xử lý riêng). */
const KIND_BY_CODE = {
  VALIDATION_ERROR: K.VALIDATION,
  INVALID_OBJECT_ID: K.VALIDATION,
  APPOINTMENT_TOO_SOON: K.SLOT_INVALID,
  APPOINTMENT_TOO_FAR: K.SLOT_INVALID,
  APPOINTMENT_SLOT_INVALID: K.SLOT_INVALID,
  APPOINTMENT_DUPLICATE: K.DUPLICATE,
  APPOINTMENT_LIMIT_REACHED: K.LIMIT,
  APPOINTMENT_CONFLICT: K.CONFLICT,
  APPOINTMENT_CAPACITY_FULL: K.CAPACITY,
  NOT_FOUND: K.CAR_GONE,
  APPOINTMENT_NOT_FOUND: K.NOT_FOUND,
  APPOINTMENT_CANCELLED_ALREADY: K.CANCELLED_ALREADY,
  APPOINTMENT_STATUS_INVALID: K.STATUS_INVALID,
  APPOINTMENT_CAR_UNAVAILABLE: K.CAR_UNAVAILABLE,
  APPOINTMENT_RESCHEDULE_NOT_ALLOWED: K.RESCHEDULE_NOT_ALLOWED,
  APPOINTMENT_RESCHEDULE_LIMIT_REACHED: K.RESCHEDULE_LIMIT,
  CUSTOMER_NOT_FOUND: K.CUSTOMER_NOT_FOUND,
}

/** Cần tải lại gì sau lỗi: lưới khung, dữ liệu lượt, hay không cần. */
const RELOAD = {
  [K.SLOT_INVALID]: 'slots',
  [K.CONFLICT]: 'slots',
  [K.CAPACITY]: 'slots',
  [K.CAR_GONE]: 'slots',
  [K.NOT_FOUND]: 'visit',
  [K.CANCELLED_ALREADY]: 'visit',
  [K.STATUS_INVALID]: 'visit',
  [K.CAR_UNAVAILABLE]: 'visit',
  [K.RESCHEDULE_NOT_ALLOWED]: 'visit',
  [K.RESCHEDULE_LIMIT]: 'visit',
}

const ACTION = {
  [K.UNAUTHORIZED]: LOGIN,
  [K.PROFILE_INCOMPLETE]: PROFILE,
  [K.DUPLICATE]: MY_VISITS,
  [K.LIMIT]: MY_VISITS,
}

const namesOf = (ids, carNames) => (ids ?? []).map((id) => carNames[id]).filter(Boolean).join(', ')

const MESSAGE = {
  [K.UNAUTHORIZED]: () => 'Phiên đăng nhập đã hết hạn.',
  [K.PROFILE_INCOMPLETE]: () => 'Vui lòng hoàn tất hồ sơ trước khi đặt lịch.',
  [K.ROLE]: () => 'Tài khoản này không dùng được chức năng này.',
  [K.VALIDATION]: () => 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.',
  [K.SLOT_INVALID]: () => 'Khung giờ này không còn hợp lệ, vui lòng chọn khung khác.',
  [K.DUPLICATE]: (errors, names, options) => {
    if (errors?.carIds?.length) return `Bạn đã có lịch cho xe${names ? ` ${names}` : ' này'}.`
    // Đổi lịch sang đúng khung hiện tại (Spec mục 6). BE dùng chung một mã cho "khung này đã có lịch khác
    // của khách", nên câu nêu cả hai khả năng thay vì khẳng định một.
    if (options.reschedule) return 'Đây là khung giờ hiện tại của lượt này hoặc bạn đã có lịch khác ở khung này, hãy chọn khung khác.'
    return 'Bạn đã có lịch ở khung giờ này.'
  },
  [K.LIMIT]: () => 'Bạn đang có 2 lượt lái thử chưa diễn ra. Hãy hủy một lượt hoặc đợi sau khi lượt diễn ra.',
  [K.CONFLICT]: (_errors, names) => (names ? `Xe ${names} đã có người đặt khung giờ này.` : 'Có xe đã có người đặt khung giờ này.'),
  [K.CAPACITY]: () => 'Khung giờ này đã kín chỗ, vui lòng chọn khung khác.',
  [K.CAR_GONE]: () => 'Một trong các xe không còn mở bán. Vui lòng chọn lại.',
  [K.NOT_FOUND]: () => 'Không tìm thấy lịch hẹn.',
  [K.CANCELLED_ALREADY]: () => 'Lịch này đã được hủy trước đó.',
  [K.STATUS_INVALID]: () => 'Không thể thực hiện thao tác này ở trạng thái hiện tại.',
  [K.CAR_UNAVAILABLE]: () => 'Có xe trong lượt này không còn bán, không thể xác nhận.',
  [K.RATE_LIMIT]: () => 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.',
  [K.NETWORK]: () => 'Không thể kết nối. Vui lòng thử lại.',
  [K.RESCHEDULE_NOT_ALLOWED]: (_errors, _names, options) => (options.audience === 'staff'
    ? 'Lượt này không còn lịch mở nên không đổi được.'
    : 'Lượt này không thể tự đổi lịch nữa. Xin gọi showroom.'),
  [K.RESCHEDULE_LIMIT]: () => 'Bạn đã đổi lịch tối đa số lần cho phép. Xin gọi showroom.',
  [K.CUSTOMER_NOT_FOUND]: () => 'Không tìm thấy khách có tài khoản. Hãy yêu cầu khách đăng ký trước.',
}

/** 404 của một đường dẫn chưa có trên BE (BE cũ): `Route … not found.` hoặc không có thân JSON của BE. */
const isMissingRoute = (status, data) => status === 404 && (!data?.code || (data.code === 'NOT_FOUND' && /^Route /.test(data.message ?? '')))

function kindOf(status, code, missingRoute) {
  if (status === undefined || missingRoute) return K.NETWORK
  if (status === 401) return K.UNAUTHORIZED
  if (status === 429 || code === 'RATE_LIMIT_EXCEEDED') return K.RATE_LIMIT
  if (status === 403) return code === 'PROFILE_INCOMPLETE' ? K.PROFILE_INCOMPLETE : K.ROLE
  if (status >= 500) return K.NETWORK
  return KIND_BY_CODE[code] ?? K.VALIDATION
}

/**
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F07
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F12
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F17
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F23
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F24
 * @param {object} error  Lỗi axios.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F29
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F36
 * @param {object} error  Lỗi axios.
 * @param {Record<string, string>} [carNames] id xe → tên, để nêu tên xe trong thông báo.
 * @param {{ audience?: 'customer'|'staff', reschedule?: boolean, newEndpoint?: boolean }} [options]
 *   `audience`: người thao tác (câu đổi lịch khác nhau); `reschedule`: lỗi của thao tác đổi lịch;
 *   `newEndpoint`: endpoint có từ BE 1.1.0, nên 404 "không có đường dẫn" coi như lỗi kết nối (FA20).
 * @returns {{ kind: string, message: string, reload: 'slots'|'visit'|'none', action: {label: string, to: string}|null, carIds: string[] }}
 */
export function classifyAppointmentError(error, carNames = {}, options = {}) {
  const status = error?.response?.status
  const data = error?.response?.data
  const missingRoute = Boolean(options.newEndpoint) && isMissingRoute(status, data)
  const kind = kindOf(status, data?.code, missingRoute)
  const errors = data?.errors && !Array.isArray(data.errors) ? data.errors : null
  const carIds = Array.isArray(errors?.carIds) ? errors.carIds : []

  return {
    kind,
    message: MESSAGE[kind](errors, namesOf(carIds, carNames), options),
    reload: RELOAD[kind] ?? 'none',
    action: ACTION[kind] ?? null,
    carIds,
  }
}
