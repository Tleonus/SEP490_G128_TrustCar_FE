/**
 * KAN-45 – Chuyển mảng `car.priceHistory` thành dữ liệu cho timeline.
 *
 * Mỗi phần tử của priceHistory chỉ lưu giá MỚI (`price`), không lưu giá cũ. Giá cũ của một
 * mốc chính là `price` của mốc liền trước theo thời gian, nên phải sắp xếp theo thời gian
 * TĂNG dần để suy ra, rồi mới đảo lại để hiển thị mới nhất lên đầu (yêu cầu AC).
 *
 * Hàm ở đây thuần, không đụng DOM/API nên test được bằng vitest.
 */

import {
  INITIAL_PRICE_LABEL,
  NO_REASON_LABEL,
  REASON_LABELS,
} from '../constants/priceHistoryConstants'

const vndFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

/** Thời điểm của một mốc; mốc thiếu/hỏng ngày coi như 0 để vẫn xếp được. */
function timeOf(entry) {
  const raw = entry?.changedAt
  if (!raw) return 0
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

/** Giá trị số hợp lệ, ngược lại null. */
function priceOf(entry) {
  const raw = entry?.price
  // Number(null) === 0 và Number('') === 0: phải chặn trước, nếu không mốc thiếu giá
  // sẽ hiện "0 đ" như thể xe được định giá 0 đồng.
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

/**
 * Định dạng tiền theo AC: "1.200.000.000 đ".
 * @param {number|null} value
 * @returns {string}
 */
export function formatVnd(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return `${vndFormatter.format(Number(value))} đ`
}

/**
 * Định dạng ngày giờ theo AC: "DD/MM/YYYY HH:mm", giờ máy người dùng.
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatChangedAt(value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Dịch mã lý do của Backend sang tiếng Việt.
 * Lý do người dùng tự nhập (không khớp mã nào) được giữ nguyên, chỉ cắt khoảng trắng.
 * @param {string|null|undefined} reason
 * @param {{ isInitial?: boolean }} [options]
 */
export function translateReason(reason, { isInitial = false } = {}) {
  const raw = String(reason ?? '').trim()
  if (!raw) return isInitial ? INITIAL_PRICE_LABEL : NO_REASON_LABEL
  const mapped = REASON_LABELS[raw.toLowerCase()]
  return mapped ?? raw
}

/** Tên người thực hiện: fullName → email → nhãn dự phòng. */
export function changedByName(entry) {
  const user = entry?.changedBy
  if (!user) return 'Không xác định'
  if (typeof user === 'string') return user
  return user.fullName || user.email || 'Không xác định'
}

/** Khoá định danh một mốc, ưu tiên _id của subdocument. */
function entryKey(entry, index) {
  return entry?._id || `${index}-${timeOf(entry)}-${priceOf(entry)}`
}

/**
 * Dựng danh sách mốc cho timeline, mới nhất lên đầu.
 *
 * @param {object[]} priceHistory mảng car.priceHistory
 * @returns {Array<{
 *   key: string,
 *   changedAt: string|Date|null,
 *   changedAtText: string,
 *   newPrice: number|null,
 *   newPriceText: string,
 *   oldPrice: number|null,
 *   oldPriceText: string|null,
 *   delta: number|null,
 *   deltaPct: number|null,
 *   deltaText: string|null,
 *   trend: 'up'|'down'|'same'|'initial',
 *   reason: string,
 *   changedBy: string,
 *   isInitial: boolean,
 * }>}
 */
export function buildPriceHistoryEntries(priceHistory) {
  const list = Array.isArray(priceHistory) ? priceHistory : []
  if (!list.length) return []

  // Sắp xếp tăng dần; cùng thời điểm thì giữ thứ tự gốc trong mảng để kết quả ổn định.
  const ascending = list
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => timeOf(a.entry) - timeOf(b.entry) || a.index - b.index)

  const entries = ascending.map(({ entry, index }, position) => {
    const newPrice = priceOf(entry)
    const previousPrice = position > 0 ? priceOf(ascending[position - 1].entry) : null
    const isInitial = position === 0
    const delta = newPrice != null && previousPrice != null ? newPrice - previousPrice : null

    let trend = 'same'
    if (previousPrice == null) trend = 'initial'
    else if (delta > 0) trend = 'up'
    else if (delta < 0) trend = 'down'

    const deltaPct = delta != null && previousPrice > 0
      ? (delta / previousPrice) * 100
      : null

    return {
      key: entryKey(entry, index),
      changedAt: entry?.changedAt ?? null,
      changedAtText: formatChangedAt(entry?.changedAt),
      newPrice,
      newPriceText: formatVnd(newPrice),
      oldPrice: previousPrice,
      oldPriceText: previousPrice == null ? null : formatVnd(previousPrice),
      delta,
      deltaPct,
      deltaText: delta == null
        ? null
        : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${formatVnd(Math.abs(delta))}`,
      trend,
      reason: translateReason(entry?.reason, { isInitial }),
      changedBy: changedByName(entry),
      isInitial,
    }
  })

  // Mới nhất lên đầu. Mảng ascending đã sắp, nên đảo là đủ.
  return entries.reverse()
}
