import {
  DEFAULTS, DOWN_MAX, DOWN_MIN, MESSAGES, METHODS, PRICE_MAX, PRICE_MIN, RATE_MAX, RATE_MIN, TERMS,
} from '../constants/installmentConstants'

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Kiểm tra giá xe và lãi suất (hai ô gõ tay); các ô còn lại luôn được ép về giá trị hợp lệ.
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F08
 * @param {{ price: *, downPercent: *, termMonths: *, ratePercent: *, method: * }} raw
 * @returns {{ ok: boolean, errors: { price?: string, ratePercent?: string }, value: object|null }}
 */
export function validateInput(raw) {
  const errors = {}
  if (!isNumber(raw.price)) errors.price = MESSAGES.priceNaN
  else if (raw.price < PRICE_MIN || raw.price > PRICE_MAX) errors.price = MESSAGES.priceRange
  if (!isNumber(raw.ratePercent)) errors.ratePercent = MESSAGES.rateNaN
  else if (raw.ratePercent < RATE_MIN || raw.ratePercent > RATE_MAX) errors.ratePercent = MESSAGES.rateRange
  if (Object.keys(errors).length > 0) return { ok: false, errors, value: null }

  return {
    ok: true,
    errors,
    value: {
      price: Math.round(raw.price),
      ratePercent: Math.round(raw.ratePercent * 100) / 100,
      downPercent: isNumber(raw.downPercent) ? clamp(Math.round(raw.downPercent), DOWN_MIN, DOWN_MAX) : DEFAULTS.downPercent,
      termMonths: TERMS.includes(raw.termMonths) ? raw.termMonths : DEFAULTS.termMonths,
      method: METHODS.some((item) => item.value === raw.method) ? raw.method : DEFAULTS.method,
    },
  }
}

/**
 * Đọc `?price=<n>`: chỉ nhận số nguyên dương trong khoảng cho phép; sai thì null (dùng mặc định, không báo lỗi).
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F09
 * @param {string} search  Chuỗi query, ví dụ `?price=1200000000`.
 * @returns {number|null}
 */
export function parsePriceParam(search) {
  const text = new URLSearchParams(search ?? '').get('price')
  if (text === null || !/^\d{1,12}$/.test(text)) return null
  const price = Number(text)
  return price >= PRICE_MIN && price <= PRICE_MAX ? price : null
}

/** Giá trị ban đầu của biểu mẫu. */
export const initialInput = (search) => ({ ...DEFAULTS, price: parsePriceParam(search) ?? DEFAULTS.price })
