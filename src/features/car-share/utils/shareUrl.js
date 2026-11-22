/**
 * KAN-67 – Tạo link chia sẻ xe.
 *
 * Link chia sẻ PHẢI là link Backend /share/car/:code (KAN-64), không phải link Frontend /xe/:code.
 * Crawler của Facebook/Zalo không chạy JavaScript, nên chỉ trang HTML do Backend render mới có
 * thẻ OG (ảnh, tiêu đề, mô tả). Backend tạo sẵn redirectUrl để đưa người xem thật về /xe/:code.
 *
 * Trang chia sẻ nằm ở gốc server Backend, ngoài /api/v1:
 *   VITE_API_BASE_URL = http://localhost:5000/api/v1  →  http://localhost:5000/share/car/TC-2024-0001
 * Có thể ghi đè bằng VITE_SHARE_BASE_URL (ví dụ khi API đi qua proxy có đường dẫn khác).
 */

import { API_BASE_URL } from '../../../config/apiConfig'

/** Định dạng mã xe Backend chấp nhận cho trang chia sẻ (TC-YYYY-NNNN). */
const VEHICLE_CODE = /^TC-\d{4}-\d{4}$/i

function absoluteHttpUrl(value, base) {
  try {
    const url = base ? new URL(value, base) : new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

/** origin + đường dẫn; bỏ query, hash và dấu / ở cuối. */
function originWithPath(url, pathname = url.pathname) {
  return `${url.origin}${pathname.replace(/\/+$/, '')}`
}

/** Địa chỉ gốc của server Backend phục vụ /share/car/:code, null nếu không xác định được. */
export function backendShareBase() {
  const configured = absoluteHttpUrl(String(import.meta.env?.VITE_SHARE_BASE_URL || '').trim())
  if (configured) return originWithPath(configured)

  // API dạng tương đối (vd. /api/v1 sau reverse proxy) thì ghép với origin của trang đang mở.
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined
  const api = absoluteHttpUrl(API_BASE_URL, origin)
  if (!api) return null
  return originWithPath(api, api.pathname.replace(/\/api\/v\d+\/?$/i, ''))
}

/**
 * Link Backend để chia sẻ một xe.
 * @param {string} vehicleCode mã xe dạng TC-YYYY-NNNN
 * @returns {string|null} null nếu mã xe không hợp lệ
 */
export function buildShareUrl(vehicleCode) {
  const code = String(vehicleCode || '').trim()
  if (!VEHICLE_CODE.test(code)) return null
  const base = backendShareBase()
  if (!base) return null
  return `${base}/share/car/${encodeURIComponent(code.toUpperCase())}`
}

export const facebookShareUrl = (shareUrl) =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`

export const zaloShareUrl = (shareUrl) =>
  `https://zalo.me/share?u=${encodeURIComponent(shareUrl)}`
