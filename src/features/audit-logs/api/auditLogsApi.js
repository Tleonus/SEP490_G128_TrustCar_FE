import api from '../../../services/api'

// Gọi API nhật ký hoạt động (BE: API-AUDIT-LOGS v1.0.0, chỉ ADMIN, chỉ đọc). Dùng axios `api` nên tự gắn Bearer token.
// Không bắt lỗi: lỗi axios được ném lên hook, phân loại bằng classifyAuditError. Không tự thử lại.
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F02, #REQ-F07, NFR-F02

const BASE = '/admin/activity-logs'

/**
 * Một trang nhật ký, mới nhất trước.
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F02
 * @param {object} params Kết quả `buildAuditParams`
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ items: object[], meta: object|null }>}
 */
export async function fetchAuditLogs(params, signal) {
  const response = await api.get(BASE, { params, signal })
  return { items: response.data.data ?? [], meta: response.data.meta ?? null }
}

/**
 * Chi tiết một sự kiện (có `changes`, `metadata`, `userAgent`).
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F07
 * @returns {Promise<object>}
 */
export async function fetchAuditLog(id, signal) {
  const response = await api.get(`${BASE}/${encodeURIComponent(id)}`, { signal })
  return response.data.data
}

/**
 * Danh mục để dựng bộ lọc: mọi loại sự kiện và loại đối tượng đang có trong nhật ký.
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F12
 * @returns {Promise<{ eventTypes: string[], targetModels: string[] }>}
 */
export async function fetchAuditMeta(signal) {
  const response = await api.get(`${BASE}/meta`, { signal })
  const data = response.data.data ?? {}
  return { eventTypes: data.eventTypes ?? [], targetModels: data.targetModels ?? [] }
}
