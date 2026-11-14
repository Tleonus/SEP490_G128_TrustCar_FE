import { PUBLIC_CAR_PATH } from '../constants/cpoCertificateConstants'

/**
 * Chuẩn hoá base URL công khai: bắt buộc http(s), bỏ dấu "/" ở cuối, bỏ query/hash.
 * Trả null nếu không hợp lệ để nơi gọi khoá việc tạo QR thay vì in ra mã sai.
 *
 * @param {string} baseUrl
 * @returns {string|null}
 */
export function normalizePublicBaseUrl(baseUrl) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) return null
  let parsed
  try {
    parsed = new URL(baseUrl.trim())
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`
}

/**
 * Dựng URL trang chi tiết xe công khai mà mã QR trỏ tới: {base}/xe/{carId}.
 *
 * @param {{ baseUrl: string, carId: string }} params
 * @returns {string|null} null khi base URL hoặc carId không hợp lệ.
 */
export function buildPublicCarUrl({ baseUrl, carId }) {
  const base = normalizePublicBaseUrl(baseUrl)
  const id = typeof carId === 'string' ? carId.trim() : ''
  if (!base || !id) return null
  return `${base}${PUBLIC_CAR_PATH}/${encodeURIComponent(id)}`
}

/**
 * Base URL công khai lấy từ cấu hình (VITE_PUBLIC_BASE_URL), mặc định là origin đang chạy.
 * Tách khỏi buildPublicCarUrl để hàm dựng URL thuần, dễ test.
 */
export function getConfiguredPublicBaseUrl() {
  const configured = import.meta.env?.VITE_PUBLIC_BASE_URL
  if (configured) return configured
  return typeof window !== 'undefined' ? window.location.origin : ''
}
