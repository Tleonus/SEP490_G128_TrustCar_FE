import {
  DEFAULTS, DOWN_MAX, DOWN_MODE_AMOUNT, DOWN_MODE_PERCENT, MESSAGES, METHODS, PRICE_MAX, PRICE_MIN, RATE_MAX, RATE_MIN,
} from '../constants/installmentConstants'
import { DEFAULT_RULES } from './loanConfig'
import { formatPrice } from '../../../utils/format'

// `rules` = { downMin, terms }: trả trước tối thiểu (% giá xe) và các thời hạn chọn được, lấy từ cấu hình admin
// (xem loanConfig.js). Không truyền → mặc định 30 % và 12–84 tháng.

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const isEmpty = (value) => value === null || value === undefined || value === ''

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/** 300000000 → "300.000.000" (ô "Số tiền bạn có"); `digitsOnly` đọc ngược lại, bỏ mọi ký tự không phải số. */
export const groupDigits = (value) => (value === undefined || value === null || value === '' ? '' : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
export const digitsOnly = (text) => String(text ?? '').replace(/\D/g, '')

/** Số tiền trả trước tối thiểu của một giá xe (mặc định 30 %). */
export const minDownAmount = (price, downMin = DEFAULT_RULES.downMin) => Math.ceil((price * downMin) / 100)

/** Giá xe cao nhất mà số tiền `amount` đủ trả trước tối thiểu (để gợi ý khách). */
export const maxPriceFor = (amount, downMin = DEFAULT_RULES.downMin) => (downMin > 0 ? Math.floor((amount * 100) / downMin) : PRICE_MAX)

/**
 * Số tiền khách đang có (ô "Số tiền bạn có"): trống → null (tạm tính theo %); sai → thông báo lỗi.
 * Hợp lệ khi đủ mức trả trước tối thiểu và còn nhỏ hơn giá xe (vẫn cần vay).
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F18
 */
const checkAmount = (amount, price, downMin) => {
  if (isEmpty(amount)) return { amount: null }
  if (!isNumber(amount) || amount < 0) return { error: MESSAGES.amountNaN }
  const rounded = Math.round(amount)
  const min = minDownAmount(price, downMin)
  if (rounded < min) {
    return { error: `Cần trả trước ít nhất ${formatPrice(min)} (${downMin}% giá xe), bạn còn thiếu ${formatPrice(min - rounded)}.` }
  }
  if (rounded >= price) return { error: MESSAGES.amountCoversPrice }
  return { amount: rounded }
}

const pickTerm = (term, terms) => {
  if (terms.includes(term)) return term
  return terms.includes(DEFAULTS.termMonths) ? DEFAULTS.termMonths : terms[terms.length - 1]
}

/**
 * Kiểm tra giá xe, lãi suất và số tiền khách có (các ô gõ tay); các ô còn lại luôn được ép
 * về giá trị hợp lệ.
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F08
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F18
 * @param {object} raw
 * @param {{ downMin: number, terms: number[] }} [rules]
 * @returns {{ ok: boolean, errors: object, value: object|null }}
 */
export function validateInput(raw, rules = DEFAULT_RULES) {
  const errors = {}
  if (!isNumber(raw.price)) errors.price = MESSAGES.priceNaN
  else if (raw.price < PRICE_MIN || raw.price > PRICE_MAX) errors.price = MESSAGES.priceRange
  if (!isNumber(raw.ratePercent)) errors.ratePercent = MESSAGES.rateNaN
  else if (raw.ratePercent < RATE_MIN || raw.ratePercent > RATE_MAX) errors.ratePercent = MESSAGES.rateRange
  const byAmount = raw.downMode === DOWN_MODE_AMOUNT
  const amount = byAmount && !errors.price ? checkAmount(raw.downAmount, Math.round(raw.price), rules.downMin) : { amount: null }
  if (amount.error) errors.downAmount = amount.error
  if (Object.keys(errors).length > 0) return { ok: false, errors, value: null }

  return {
    ok: true,
    errors,
    value: {
      price: Math.round(raw.price),
      ratePercent: Math.round(raw.ratePercent * 100) / 100,
      downPercent: isNumber(raw.downPercent) ? clamp(Math.round(raw.downPercent), rules.downMin, DOWN_MAX) : Math.max(DEFAULTS.downPercent, rules.downMin),
      downAmount: amount.amount, // có → thay cho downPercent
      termMonths: pickTerm(raw.termMonths, rules.terms),
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
export function parseQueryParams(search, rules = DEFAULT_RULES) {
  const params = new URLSearchParams(search ?? '')
  const found = {
    price: parsePriceParam(search),
    downPercent: intParam(params, 'down', (n) => n >= rules.downMin && n <= DOWN_MAX),
    termMonths: intParam(params, 'term', (n) => rules.terms.includes(n)),
  }
  const rateText = params.get('rate')
  if (rateText !== null && /^\d{1,2}(\.\d{1,2})?$/.test(rateText)) {
    const rate = Number(rateText)
    if (rate >= RATE_MIN && rate <= RATE_MAX) found.ratePercent = rate
  }
  return Object.fromEntries(Object.entries(found).filter(([, value]) => value !== null))
}

/**
 * Giá trị ban đầu của biểu mẫu. Liên kết có `?down=` (khối ở trang chi tiết xe) → giữ cách nhập theo %;
 * còn lại → ô "Số tiền bạn có" (trống, tạm tính theo mức tối thiểu cho tới khi khách nhập).
 */
export const initialInput = (search, rules = DEFAULT_RULES) => {
  const found = parseQueryParams(search, rules)
  return { ...DEFAULTS, ...found, downMode: found.downPercent ? DOWN_MODE_PERCENT : DOWN_MODE_AMOUNT }
}

/**
 * Đường dẫn sang trang tính chi tiết, mang giá xe và thông số đã chọn ở khối trang chi tiết xe.
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F07
 */
export const buildInstallmentLink = ({ price, downPercent, termMonths, carCode = null }) =>
  `/installment?price=${Math.round(price)}&down=${downPercent}&term=${termMonths}${carCode ? `&car=${encodeURIComponent(carCode)}` : ''}`
