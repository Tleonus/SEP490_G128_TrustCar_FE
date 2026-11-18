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

/** Giá xe có hợp lệ để hiện khối ước tính trả góp ở trang chi tiết xe không (KAN-62 REQ-F01/F02). */
export const isWidgetPrice = (price) => isNumber(price) && price >= PRICE_MIN && price <= PRICE_MAX

/** Số nguyên 1–3 chữ số trong URL; null nếu sai khuôn hoặc `accept(n)` từ chối. */
const intParam = (params, name, accept) => {
  const text = params.get(name)
  if (text === null || !/^\d{1,3}$/.test(text)) return null
  const value = Number(text)
  return accept(value) ? value : null
}

/**
 * Đọc `?price=`, `?down=`, `?term=`, `?rate=`; tham số nào sai thì bị bỏ qua (không báo lỗi).
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F09
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F08
 * @returns {{ price?: number, downPercent?: number, termMonths?: number, ratePercent?: number }}
 */
export function parseQueryParams(search) {
  const params = new URLSearchParams(search ?? '')
  const found = {
    price: parsePriceParam(search),
    downPercent: intParam(params, 'down', (n) => n >= DOWN_MIN && n <= DOWN_MAX),
    termMonths: intParam(params, 'term', (n) => TERMS.includes(n)),
  }
  const rateText = params.get('rate')
  if (rateText !== null && /^\d{1,2}(\.\d{1,2})?$/.test(rateText)) {
    const rate = Number(rateText)
    if (rate >= RATE_MIN && rate <= RATE_MAX) found.ratePercent = rate
  }
  return Object.fromEntries(Object.entries(found).filter(([, value]) => value !== null))
}

/** Giá trị ban đầu của biểu mẫu. */
export const initialInput = (search) => ({ ...DEFAULTS, ...parseQueryParams(search) })

/**
 * Đường dẫn sang trang tính chi tiết, mang giá xe và thông số đã chọn ở khối trang chi tiết xe.
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F07
 */
export const buildInstallmentLink = ({ price, downPercent, termMonths }) =>
  `/installment?price=${Math.round(price)}&down=${downPercent}&term=${termMonths}`
