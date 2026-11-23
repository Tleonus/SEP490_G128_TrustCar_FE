import api from '../../../services/api'

// Gọi API nhật ký hoạt động (KAN-92: GET /api/v1/manage/audit-logs, chỉ ADMIN, chỉ đọc). Dùng axios `api` nên tự gắn token.
// Không bắt lỗi: lỗi axios được ném lên hook, phân loại bằng classifyAuditError. Không tự thử lại.
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F02, #REQ-F07, NFR-F02

const BASE = '/manage/audit-logs'

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
 * Danh mục để dựng bộ lọc: loại sự kiện, loại đối tượng, nhóm hành động (KAN-92), bảng sự kiện → hành động
 * và email những người có trong nhật ký.
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F12
 * @returns {Promise<{ eventTypes: string[], targetModels: string[], actions: string[], eventActions: Record<string, string>, actorEmails: string[] }>}
 */
export async function fetchAuditMeta(signal) {
  const response = await api.get(`${BASE}/meta`, { signal })
  const data = response.data.data ?? {}
  const list = (value) => (Array.isArray(value) ? value : [])
  return {
    eventTypes: list(data.eventTypes),
    targetModels: list(data.targetModels),
    actions: list(data.actions),
    eventActions: data.eventActions && typeof data.eventActions === 'object' ? data.eventActions : {},
    actorEmails: list(data.actorEmails),
  }
}
