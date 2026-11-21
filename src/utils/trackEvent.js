/**
 * KAN-97 — util fire-and-forget gọi POST /api/v1/track.
 *
 * - Không await ở nơi gọi, không retry, nuốt lỗi hoàn toàn.
 * - Lưu sessionId trong sessionStorage để lần sau dùng lại (BE dùng để gộp
 *   các tương tác trong cùng phiên về cùng VisitorSession).
 * - Tôn trọng DNT / Global Privacy Control.
 * - Nếu khách đã đăng nhập, axios interceptor tự gắn Bearer token nên BE
 *   bắt được `req.user.customer` và gán vào session.
 */

import api from '../services/api'

const SESSION_KEY = 'trustcar_track_session'

const privacyOptOut = () => {
  if (typeof navigator === 'undefined') return false
  if (navigator.doNotTrack === '1') return true
  if (navigator.globalPrivacyControl === true) return true
  return false
}

const readSessionId = () => {
  try {
    return window.sessionStorage.getItem(SESSION_KEY)
  } catch { return null }
}

const writeSessionId = (id) => {
  if (!id) return
  try { window.sessionStorage.setItem(SESSION_KEY, id) } catch { /* storage bị chặn */ }
}

/**
 * Gửi 1 event tracking. An toàn gọi trong render/effect — không ném lỗi.
 *
 * @param {string} eventType     VIEW_CAR | WISHLIST_ADD | COMPARE_ADD | CALCULATOR_USE | FILTER_APPLY | CONTACT_CLICK
 * @param {object} [options]
 * @param {string|null} [options.carId]
 * @param {object|null} [options.metadata]
 */
export function trackEvent(eventType, { carId = null, metadata = null } = {}) {
  if (!eventType) return
  if (typeof window === 'undefined') return
  if (privacyOptOut()) return

  const body = { eventType }
  const sessionId = readSessionId()
  if (sessionId) body.sessionId = sessionId
  if (carId) body.carId = carId
  if (metadata && Object.keys(metadata).length) body.metadata = metadata

  api.post('/track', body)
    .then((response) => {
      const next = response?.data?.data?.sessionId
      if (next) writeSessionId(next)
    })
    .catch(() => { /* fire-and-forget */ })
}

export default trackEvent
