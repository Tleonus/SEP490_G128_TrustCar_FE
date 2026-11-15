// Phân loại lỗi axios của API nhật ký thành thông điệp tiếng Việt.
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F08..F10 (mục 6 Ánh xạ lỗi)

/**
 * @typedef {'CANCELED'|'UNAUTHORIZED'|'FORBIDDEN'|'NOT_FOUND'|'UNAVAILABLE'|'VALIDATION'|'RATE_LIMIT'|'NETWORK'|'SERVER'} AuditErrorKind
 */

/**
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F08
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F09
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F10
 * @param {*} error Lỗi axios gốc (hoặc bất kỳ giá trị nào được ném lên)
 * @returns {{ kind: AuditErrorKind, message: string, retry: boolean, status: number|null, canceled: boolean }}
 *   `retry`: nên hiện "Thử lại". `canceled`: yêu cầu bị hủy có chủ ý (hook bỏ qua, không báo lỗi).
 */
export function classifyAuditError(error) {
  const status = error?.response?.status ?? null
  const data = error?.response?.data
  const make = (kind, message, retry) => ({ kind, message, retry, status, canceled: kind === 'CANCELED' })

  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
    return make('CANCELED', '', false)
  }
  if (status === null) return make('NETWORK', 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.', true)
  if (status === 401) return make('UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', false)
  if (status === 403) return make('FORBIDDEN', 'Bạn không có quyền xem nhật ký hoạt động.', false)
  if (status === 404 && data?.code === 'ACTIVITY_LOG_NOT_FOUND') return make('NOT_FOUND', 'Không tìm thấy sự kiện.', false)
  if (status === 404) return make('UNAVAILABLE', 'Máy chủ chưa hỗ trợ chức năng nhật ký hoạt động.', true)
  if (status === 422) {
    const detail = Array.isArray(data?.errors) && data.errors[0]?.message ? ` (${data.errors[0].message})` : ''
    return make('VALIDATION', `Bộ lọc không hợp lệ${detail}.`, false)
  }
  if (status === 429) return make('RATE_LIMIT', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.', true)
  return make('SERVER', 'Hệ thống đang bận, vui lòng thử lại.', true)
}
