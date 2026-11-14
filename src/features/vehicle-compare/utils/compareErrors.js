// Phân loại lỗi của API so sánh thành các nhóm giao diện cần xử lý.
// Ref: .sdd/features/vehicle-comparison/SPEC.md (mục 6) và hợp đồng API-VEHICLE-COMPARE

export const COMPARE_ERROR = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  ROLE: 'ROLE',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  NOT_ENOUGH: 'NOT_ENOUGH',
  INVALID: 'INVALID',
  NETWORK: 'NETWORK',
})

const MESSAGE = {
  [COMPARE_ERROR.UNAUTHORIZED]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  [COMPARE_ERROR.ROLE]:
    'Tài khoản quản trị hoặc nhân viên không dùng được tính năng so sánh. Hãy đăng nhập bằng tài khoản khách hàng.',
  [COMPARE_ERROR.PROFILE_INCOMPLETE]: 'Vui lòng hoàn tất hồ sơ tài khoản trước khi so sánh.',
  [COMPARE_ERROR.NOT_ENOUGH]: 'Không đủ xe còn bán để so sánh.',
  [COMPARE_ERROR.INVALID]: 'Danh sách xe so sánh không hợp lệ. Vui lòng chọn lại.',
  [COMPARE_ERROR.NETWORK]: 'Không thể tải dữ liệu so sánh. Vui lòng thử lại.',
}

/**
 * Phân loại lỗi axios của yêu cầu so sánh.
 * Trả { kind, message, unavailableIds } (unavailableIds chỉ có nội dung với NOT_ENOUGH).
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F15
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F17
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F18
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F19
 */
export function classifyCompareError(error) {
  const status = error?.response?.status
  const data = error?.response?.data
  const code = data?.code

  let kind = COMPARE_ERROR.NETWORK
  if (status === 401) kind = COMPARE_ERROR.UNAUTHORIZED
  else if (status === 403) kind = code === 'PROFILE_INCOMPLETE' ? COMPARE_ERROR.PROFILE_INCOMPLETE : COMPARE_ERROR.ROLE
  else if (status === 422) kind = code === 'COMPARE_NOT_ENOUGH_CARS' ? COMPARE_ERROR.NOT_ENOUGH : COMPARE_ERROR.INVALID

  const ids = kind === COMPARE_ERROR.NOT_ENOUGH ? data?.errors?.unavailableIds : []
  return { kind, message: MESSAGE[kind], unavailableIds: Array.isArray(ids) ? ids : [] }
}
