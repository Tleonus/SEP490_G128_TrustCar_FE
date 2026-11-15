// Dựng tham số truy vấn danh sách nhật ký từ bộ lọc trên giao diện và kiểm tra khoảng ngày.
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F04, #REQ-F05 (CF3, CF4)

import { PAGE_SIZE } from '../constants/auditConstants'

/** Bộ lọc rỗng (mọi ô trống). */
export const EMPTY_FILTERS = Object.freeze({ eventType: '', targetModel: '', actorEmail: '', from: '', to: '' })

const clean = (value) => (typeof value === 'string' ? value.trim() : '')

/**
 * Tham số gửi cho `GET /admin/activity-logs`: chỉ các ô có giá trị (cắt khoảng trắng), `page`, `limit=20`.
 * Ngày là `YYYY-MM-DD` (giờ VN) gửi nguyên cho BE.
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F04
 * @param {Partial<typeof EMPTY_FILTERS>} [filters]
 * @param {number} [page]
 * @returns {{ page: number, limit: number, eventType?: string, targetModel?: string, actorEmail?: string, from?: string, to?: string }}
 */
export function buildAuditParams(filters = {}, page = 1) {
  const params = { page: Math.max(1, Math.floor(Number(page)) || 1), limit: PAGE_SIZE }
  for (const key of Object.keys(EMPTY_FILTERS)) {
    const value = clean(filters?.[key])
    if (value) params[key] = value
  }
  return params
}

/**
 * Khoảng ngày sai thứ tự? Trả thông báo lỗi hoặc `null`. Một đầu trống luôn hợp lệ; cùng một ngày hợp lệ.
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F05
 * @returns {string|null}
 */
export function validateRange(from, to) {
  const start = clean(from)
  const end = clean(to)
  if (start && end && start > end) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
  return null
}

/** Có ô lọc nào đang có giá trị không (để bật nút "Đặt lại"). */
export const hasActiveFilters = (filters) => Object.keys(EMPTY_FILTERS).some((key) => clean(filters?.[key]) !== '')
