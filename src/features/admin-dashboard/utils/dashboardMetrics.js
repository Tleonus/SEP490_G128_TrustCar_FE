/**
 * KAN-35 – Tính toán thuần cho trang Tổng quan điều hành.
 *
 * Toàn bộ hàm ở đây không gọi API, không đụng DOM, nên test được bằng vitest (môi trường node).
 *
 * Quy ước ngày bán: `soldAt` là nguồn đúng; dữ liệu cũ có thể chưa có trường này nên lùi về
 * `statusChangedAt` (thời điểm xe chuyển sang SOLD). Xe SOLD thiếu cả hai thì không xếp được
 * vào tháng nào — hàm đếm riêng để UI cảnh báo thay vì âm thầm bỏ qua.
 */

import { BRAND_TOP_N, PENDING_INSPECTION_STATUS, PENDING_SALE_STATUS } from '../constants/dashboardConstants'

const numberFormatter = new Intl.NumberFormat('vi-VN')

/** Khoá tháng dạng YYYY-MM theo giờ máy người dùng. */
export function monthKey(date) {
  // new Date(null) là 01/01/1970, không phải "không có ngày" — phải chặn trước.
  if (date === null || date === undefined || date === '') return null
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Nhãn tháng ngắn gọn, ví dụ "T11". */
export function monthLabel(date) {
  return `T${date.getMonth() + 1}`
}

/** Thời điểm bán của xe, null nếu không xác định được. */
export function soldDateOf(car) {
  const raw = car?.soldAt || car?.statusChangedAt || null
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Giá bán (VND) dùng cho doanh thu; null/không hợp lệ coi như 0. */
function priceOf(car) {
  const value = Number(car?.price)
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * Doanh thu + số xe bán theo từng tháng, cũ nhất → mới nhất.
 * @param {object[]} cars danh sách xe quản trị
 * @param {{ months?: number, now?: Date }} [options]
 * @returns {{ key: string, label: string, revenue: number, soldCount: number }[]}
 */
export function buildMonthlyRevenue(cars, { months = 6, now = new Date() } = {}) {
  const buckets = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    buckets.push({ key: monthKey(d), label: monthLabel(d), revenue: 0, soldCount: 0 })
  }
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const car of Array.isArray(cars) ? cars : []) {
    if (car?.status !== 'SOLD') continue
    const soldAt = soldDateOf(car)
    if (!soldAt) continue
    const bucket = byKey.get(monthKey(soldAt))
    if (!bucket) continue
    bucket.revenue += priceOf(car)
    bucket.soldCount += 1
  }

  return buckets
}

/**
 * Chỉ số KPI ở đầu trang.
 * @param {object[]} cars
 * @param {{ now?: Date }} [options]
 */
export function computeKpis(cars, { now = new Date() } = {}) {
  const list = Array.isArray(cars) ? cars : []
  const thisKey = monthKey(now)
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevKey = monthKey(prevDate)

  let revenueThisMonth = 0
  let revenuePrevMonth = 0
  let soldThisMonth = 0
  let soldPrevMonth = 0
  let availableInventory = 0
  let inspectionQueue = 0
  let saleQueue = 0
  let soldMissingDate = 0

  for (const car of list) {
    if (car?.status === 'AVAILABLE') availableInventory += 1
    if (car?.status === PENDING_INSPECTION_STATUS) inspectionQueue += 1
    if (car?.status === PENDING_SALE_STATUS) saleQueue += 1

    if (car?.status !== 'SOLD') continue
    const soldAt = soldDateOf(car)
    if (!soldAt) {
      soldMissingDate += 1
      continue
    }
    const key = monthKey(soldAt)
    if (key === thisKey) {
      revenueThisMonth += priceOf(car)
      soldThisMonth += 1
    } else if (key === prevKey) {
      revenuePrevMonth += priceOf(car)
      soldPrevMonth += 1
    }
  }

  return {
    revenueThisMonth,
    revenuePrevMonth,
    // null = không tính được % (tháng trước chưa có doanh thu)
    revenueDeltaPct: revenuePrevMonth > 0
      ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100
      : null,
    soldThisMonth,
    soldPrevMonth,
    soldDelta: soldThisMonth - soldPrevMonth,
    availableInventory,
    pendingApprovals: inspectionQueue + saleQueue,
    inspectionQueue,
    saleQueue,
    soldMissingDate,
    totalCars: list.length,
  }
}

/**
 * Tỷ trọng xe theo hãng: lấy N hãng nhiều xe nhất, phần còn lại gộp thành "Hãng khác".
 * @param {object[]} cars
 * @param {{ limit?: number }} [options]
 * @returns {{ name: string, value: number }[]}
 */
export function buildBrandBreakdown(cars, { limit = BRAND_TOP_N } = {}) {
  const counts = new Map()
  for (const car of Array.isArray(cars) ? cars : []) {
    const brand = String(car?.make ?? '').trim()
    if (!brand) continue
    const key = brand.toUpperCase()
    const current = counts.get(key)
    if (current) current.value += 1
    else counts.set(key, { name: brand.toUpperCase(), value: 1 })
  }

  const sorted = [...counts.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
  if (sorted.length <= limit) return sorted

  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit).reduce((sum, item) => sum + item.value, 0)
  return rest > 0 ? [...top, { name: 'Hãng khác', value: rest }] : top
}

/** Xe vừa chốt bán, mới nhất trước. Bỏ xe SOLD nhưng thiếu ngày bán. */
export function recentSoldCars(cars, limit = 5) {
  return (Array.isArray(cars) ? cars : [])
    .filter((car) => car?.status === 'SOLD' && soldDateOf(car))
    .sort((a, b) => soldDateOf(b) - soldDateOf(a))
    .slice(0, limit)
}

/**
 * Đếm tồn kho theo trạng thái — dùng cho dải ô tồn kho và các thẻ KPI.
 * @param {object[]} cars
 * @returns {{ total: number, available: number, incoming: number, reserved: number, sold: number, pendingInspection: number, pendingSale: number }}
 */
export function inventoryBreakdown(cars) {
  const counts = {
    total: 0,
    available: 0,
    incoming: 0,
    reserved: 0,
    sold: 0,
    pendingInspection: 0,
    pendingSale: 0,
  }
  for (const car of Array.isArray(cars) ? cars : []) {
    counts.total += 1
    switch (car?.status) {
      case 'AVAILABLE': counts.available += 1; break
      case 'INCOMING': counts.incoming += 1; break
      case 'RESERVED': counts.reserved += 1; break
      case 'SOLD': counts.sold += 1; break
      case PENDING_INSPECTION_STATUS: counts.pendingInspection += 1; break
      case PENDING_SALE_STATUS: counts.pendingSale += 1; break
      default: break
    }
  }
  return counts
}

/** Xe mới nhập kho gần đây, sắp theo ngày nhập (lùi về updatedAt nếu thiếu). */
export function recentNewCars(cars, limit = 5) {
  const dateOf = (car) => {
    const raw = car?.listedDate || car?.createdAt || car?.updatedAt
    if (!raw) return 0
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? 0 : d.getTime()
  }
  return [...(Array.isArray(cars) ? cars : [])]
    .filter((car) => car?.status !== 'SOLD')
    .sort((a, b) => dateOf(b) - dateOf(a))
    .slice(0, limit)
}

/** Lead mới nhất trước; ưu tiên createdAt, lùi về updatedAt nếu thiếu. */
export function recentLeads(leads, limit = 10) {
  const timeOf = (lead) => {
    const raw = lead?.createdAt || lead?.updatedAt
    const d = raw ? new Date(raw) : null
    return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0
  }
  return [...(Array.isArray(leads) ? leads : [])]
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, limit)
}

/**
 * Rút gọn số tiền cho thẻ KPI: 12,5 tỷ / 850 triệu / 12.345.
 * @param {number} value VND
 * @returns {string}
 */
export function formatVndCompact(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return '0'
  const oneDecimal = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
  if (amount >= 1_000_000_000) return `${oneDecimal(amount / 1_000_000_000)} tỷ`
  if (amount >= 1_000_000) return `${oneDecimal(amount / 1_000_000)} triệu`
  return numberFormatter.format(amount)
}

/** Nhãn đầy đủ của số tiền, dùng cho tooltip và title. */
export function formatVndFull(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0 ₫'
  return `${numberFormatter.format(amount)} ₫`
}
