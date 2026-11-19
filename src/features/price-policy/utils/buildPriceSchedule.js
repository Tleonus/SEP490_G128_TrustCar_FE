/**
 * Dựng lịch sử giá của một xe theo chính sách tồn kho:
 *   giá gốc (giá niêm yết khi nhập kho) → cứ 60 ngày giảm 5% giá gốc.
 *
 * Ví dụ giá gốc 600 triệu: ngày 60 = 570tr, ngày 120 = 540tr, ngày 180 = 510tr…
 * Mức giảm luôn tính trên giá gốc nên mỗi đợt giảm đúng 5% tuyệt đối, không cộng dồn lãi.
 */

import { DROP_INTERVAL_DAYS, DROP_RATE, MAX_STEPS } from '../constants/pricePolicyConstants'

const DAY_MS = 24 * 60 * 60 * 1000

/** Giá tại bậc thứ step (0 = giá gốc). Làm tròn về đồng để hiển thị không bị lẻ. */
export function priceAtStep(basePrice, step) {
  if (!Number.isFinite(basePrice) || basePrice <= 0 || step < 0) return null
  return Math.round(basePrice * (1 - DROP_RATE * step))
}

/**
 * Chuyển ngày nhập kho thành số ngày đã tồn tính đến `now`.
 * @param {string|Date} listedDate
 * @param {number} [now] mốc thời gian (ms), cho phép truyền vào khi test
 */
export function daysInStockOf(listedDate, now = Date.now()) {
  if (!listedDate) return null
  const listed = new Date(listedDate)
  if (Number.isNaN(listed.getTime())) return null
  return Math.max(0, Math.floor((now - listed.getTime()) / DAY_MS))
}

/**
 * Lịch sử giá đầy đủ: các mốc đã áp dụng + mốc kế tiếp sắp áp dụng.
 *
 * @param {object} car dòng xe từ GET /manage/cars (cần listedDate và price)
 * @param {number} [now] mốc thời gian (ms)
 * @returns {{
 *   basePrice: number|null,
 *   entries: Array<{
 *     step: number, price: number, effectiveDate: Date|null, applied: boolean,
 *     dropAmount: number, totalDrop: number, totalPct: number
 *   }>,
 *   appliedCount: number,
 *   nextStep: object|null,
 *   daysInStock: number|null,
 *   daysToNextDrop: number|null,
 *   missingListedDate: boolean,
 * }}
 */
export function buildPriceSchedule(car, now = Date.now()) {
  const basePrice = Number(car?.price)
  const daysInStock = daysInStockOf(car?.listedDate, now)
  const missingListedDate = daysInStock == null

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return {
      basePrice: null,
      entries: [],
      appliedCount: 0,
      nextStep: null,
      daysInStock,
      daysToNextDrop: null,
      missingListedDate,
    }
  }

  const appliedCount = missingListedDate ? 0 : Math.floor(daysInStock / DROP_INTERVAL_DAYS)
  // Các mốc đã qua + một mốc kế tiếp để người xem thấy xu hướng sắp giảm.
  const lastStep = missingListedDate ? 0 : Math.min(appliedCount + 1, MAX_STEPS)
  const listed = missingListedDate ? null : new Date(car.listedDate)

  const entries = []
  for (let step = 0; step <= lastStep; step += 1) {
    const price = priceAtStep(basePrice, step)
    // Giá đã giảm hết về 0 thì dừng: lịch không còn ý nghĩa.
    if (price == null || price <= 0) break
    const prevPrice = step > 0 ? priceAtStep(basePrice, step - 1) : null
    entries.push({
      step,
      price,
      effectiveDate: listed ? new Date(listed.getTime() + step * DROP_INTERVAL_DAYS * DAY_MS) : null,
      applied: step <= appliedCount,
      dropAmount: prevPrice == null ? 0 : prevPrice - price,
      totalDrop: basePrice - price,
      totalPct: Math.round(((basePrice - price) / basePrice) * 1000) / 10,
    })
  }

  // Mới nhất lên đầu, giống cách màn lịch sử giá cũ hiển thị.
  entries.reverse()

  const nextStep = entries.find((entry) => !entry.applied) ?? null
  const daysToNextDrop = nextStep
    ? Math.max(0, DROP_INTERVAL_DAYS - (daysInStock % DROP_INTERVAL_DAYS))
    : null

  return {
    basePrice,
    entries,
    appliedCount,
    nextStep,
    daysInStock,
    daysToNextDrop,
    missingListedDate,
  }
}
