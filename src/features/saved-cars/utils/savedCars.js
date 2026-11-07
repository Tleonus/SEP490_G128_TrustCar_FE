// Hàm thuần cho danh sách xe đã lưu (không đụng React, localStorage hay mạng).

export const SAVED_CARS_STORAGE_KEY = 'trustcar:saved-cars'
export const MAX_SAVED_CARS = 50
const MAX_HISTORY = 12

const textOf = (value, nestedKey) => {
  if (typeof value === 'string') return value
  return value && typeof value[nestedKey] === 'string' ? value[nestedKey] : ''
}

const imageOf = (images) => {
  if (!Array.isArray(images) || images.length === 0) return null
  const chosen = images.find((item) => item && typeof item === 'object' && (item.isPrimary || item.is_cover)) ?? images[0]
  const url = typeof chosen === 'string' ? chosen : chosen?.url || chosen?.image_url
  return typeof url === 'string' && url ? url : null
}

const toNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

export const priceOf = (car) => toNumber(car?.price ?? car?.listedPrice ?? car?.listed_price)

/** Khóa nhận diện xe: ưu tiên _id, sau đó mã xe. */
export function savedIdOf(car) {
  const raw = car?._id ?? car?.id ?? car?.vehicleCode ?? car?.stock_code
  return typeof raw === 'string' && raw ? raw.toLowerCase() : null
}

/** Chuyển xe từ API thành mục lưu. Trả null nếu xe không có khóa nhận diện. */
export function toSavedItem(car, now = Date.now()) {
  const id = savedIdOf(car)
  if (!id) return null
  const price = priceOf(car)
  const title = [textOf(car.brand, 'brand_name') || car.make, textOf(car.model, 'model_name'), car.variant]
    .filter((part) => typeof part === 'string' && part)
    .join(' ')

  return {
    id,
    rawId: car._id ?? car.id ?? null,
    routeKey: car.vehicleCode || car.stock_code || car._id || car.id,
    vehicleCode: car.vehicleCode || car.stock_code || null,
    title: title || 'Xe',
    image: imageOf(car.images),
    year: toNumber(car.year ?? car.manufacturing_year),
    mileage: toNumber(car.mileage ?? car.mileage_km),
    savedPrice: price,
    currentPrice: price,
    history: price == null ? [] : [{ price, at: now }],
    status: 'AVAILABLE',
    savedAt: now,
    checkedAt: now,
    alert: { enabled: false, targetPrice: null },
    seenDropPrice: null,
  }
}

/** Làm sạch dữ liệu đọc từ localStorage. */
export function sanitizeSaved(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const items = []
  for (const entry of value) {
    if (!entry || typeof entry.id !== 'string' || entry.isMockOnly || seen.has(entry.id)) continue
    seen.add(entry.id)
    items.push({
      ...entry,
      title: typeof entry.title === 'string' && entry.title ? entry.title : 'Xe',
      savedPrice: toNumber(entry.savedPrice),
      currentPrice: toNumber(entry.currentPrice),
      history: Array.isArray(entry.history) ? entry.history.filter((h) => toNumber(h?.price) != null).slice(-MAX_HISTORY) : [],
      status: entry.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE',
      alert: {
        enabled: Boolean(entry.alert?.enabled),
        targetPrice: toNumber(entry.alert?.targetPrice),
      },
    })
    if (items.length === MAX_SAVED_CARS) break
  }
  return items
}

/** Cập nhật giá và thông tin phụ từ dữ liệu xe mới nhất, ghi lịch sử khi giá thay đổi. */
export function applyPrice(item, priceOrCar, now = Date.now()) {
  const isCarObj = priceOrCar && typeof priceOrCar === 'object'
  const price = isCarObj ? priceOf(priceOrCar) : toNumber(priceOrCar)
  const freshImage = isCarObj ? imageOf(priceOrCar.images) : null
  const freshYear = isCarObj ? toNumber(priceOrCar.year ?? priceOrCar.manufacturing_year) : null
  const freshMileage = isCarObj ? toNumber(priceOrCar.mileage ?? priceOrCar.mileage_km) : null
  const freshCode = isCarObj ? (priceOrCar.vehicleCode || priceOrCar.stock_code || null) : null

  const next = {
    ...item,
    image: item.image || freshImage || null,
    year: item.year ?? freshYear,
    mileage: item.mileage ?? freshMileage,
    vehicleCode: item.vehicleCode || freshCode,
    checkedAt: now,
    status: 'AVAILABLE',
  }
  if (price == null) return next
  const last = item.history[item.history.length - 1]
  next.currentPrice = price
  if (next.savedPrice == null) next.savedPrice = price
  if (!last || last.price !== price) next.history = [...item.history, { price, at: now }].slice(-MAX_HISTORY)
  return next
}

/** Mức giảm so với giá lúc lưu. */
export function getPriceChange(item) {
  const { savedPrice, currentPrice } = item
  if (savedPrice == null || currentPrice == null || savedPrice === 0) return { amount: 0, percent: 0, direction: 'flat' }
  const amount = savedPrice - currentPrice
  const percent = (amount / savedPrice) * 100
  return { amount, percent, direction: amount > 0 ? 'down' : amount < 0 ? 'up' : 'flat' }
}

export const isPriceDropped = (item) => item.status === 'AVAILABLE' && getPriceChange(item).direction === 'down'

export const isTargetReached = (item) =>
  item.status === 'AVAILABLE' &&
  item.alert.enabled &&
  item.alert.targetPrice != null &&
  item.currentPrice != null &&
  item.currentPrice <= item.alert.targetPrice

/** Mục có thông báo mới chưa xem (giảm giá hoặc chạm giá mục tiêu). */
export const hasUnseenAlert = (item) =>
  (isPriceDropped(item) || isTargetReached(item)) && item.seenDropPrice !== item.currentPrice

/** Định dạng giá rút gọn: 1,25 tỷ / 650 triệu. */
export function formatCompactPrice(value) {
  if (value == null) return 'Liên hệ'
  const abs = Math.abs(value)
  const fmt = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n)
  if (abs >= 1e9) return `${fmt(value / 1e9)} tỷ`
  if (abs >= 1e6) return `${fmt(value / 1e6)} triệu`
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatRelativeTime(timestamp, now = Date.now()) {
  if (!timestamp) return 'chưa cập nhật'
  const minutes = Math.round((now - timestamp) / 60000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.round(hours / 24)
  return `${days} ngày trước`
}
