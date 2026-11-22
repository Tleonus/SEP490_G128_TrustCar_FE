// Nhãn hiển thị của sự kiện, người thực hiện và đối tượng trong nhật ký.
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F03, #REQ-F12

import { EVENT_LABELS, SYSTEM_ACTOR_LABEL, UNKNOWN_ACTOR_LABEL } from '../constants/auditConstants'

/**
 * Nhãn tiếng Việt của mã sự kiện; mã lạ hiện nguyên mã (không bao giờ lỗi), thiếu mã hiện chuỗi rỗng.
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F12
 */
export function eventLabel(code) {
  if (code === null || code === undefined) return ''
  return Object.hasOwn(EVENT_LABELS, code) ? EVENT_LABELS[code] : String(code)
}

/**
 * Người thực hiện: email; không có cả email lẫn id → hành động của hệ thống; có id mà không có email → "không rõ email".
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F03
 * @param {{ id?: string|null, email?: string|null }|null|undefined} actor
 * @returns {{ text: string, system: boolean }}
 */
export function describeActor(actor) {
  const email = typeof actor?.email === 'string' ? actor.email.trim() : ''
  if (email) return { text: email, system: false }
  if (actor?.id) return { text: UNKNOWN_ACTOR_LABEL, system: false }
  return { text: SYSTEM_ACTOR_LABEL, system: true }
}

/**
 * Đối tượng: `Loại · Mã`, chỉ loại, chỉ mã, hoặc "—" khi không có gì.
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F03
 * @param {{ model?: string|null, code?: string|null }|null|undefined} target
 * @returns {string}
 */
export function describeTarget(target) {
  const parts = [target?.model, target?.code]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '—'
}
