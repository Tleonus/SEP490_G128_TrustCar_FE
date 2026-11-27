import { FALLBACK_LOAN_SETTINGS } from '../constants/bankRates'
import { DOWN_MAX, RATE_MAX, RATE_MIN, TERMS } from '../constants/installmentConstants'

// Chuyển dữ liệu GET /settings/loan thành cấu hình trang tính dùng được. Dữ liệu thiếu/sai → dùng dự phòng,
// không bao giờ làm hỏng trang.

/** Thời hạn vay dài nhất trang tính hỗ trợ (tháng). */
export const TERM_CAP = 120

const isRate = (value) => typeof value === 'number' && Number.isFinite(value) && value >= RATE_MIN && value <= RATE_MAX

const posInt = (value) => (Number.isInteger(value) && value > 0 ? value : null)

const cleanBank = (bank) => {
  if (!bank || typeof bank.id !== 'string' || typeof bank.name !== 'string' || !isRate(bank.promoRate)) return null
  return {
    id: bank.id,
    name: bank.name,
    isPartner: bank.isPartner === true,
    active: bank.active !== false,
    promoRate: bank.promoRate,
    maxLoanPct: posInt(bank.maxLoanPct),
    minLoanAmount: posInt(bank.minLoanAmount),
    minTermMonths: posInt(bank.minTermMonths),
    maxTermMonths: posInt(bank.maxTermMonths),
    note: typeof bank.note === 'string' ? bank.note : '',
    cars: typeof bank.cars === 'string' ? bank.cars : '',
    sourceUrl: /^https?:\/\//i.test(bank.sourceUrl ?? '') ? bank.sourceUrl : '',
    sourceDate: typeof bank.sourceDate === 'string' ? bank.sourceDate : '',
  }
}

/**
 * Thời hạn khi cấu hình chưa có danh sách `termOptions` (bản lưu cũ): bội số 12 tháng trong [min, max]
 * (tối đa 120); không có bội số nào → [max].
 * @returns {number[]}
 */
export function termOptions(minTermMonths, maxTermMonths) {
  const max = Number.isInteger(maxTermMonths) ? Math.min(maxTermMonths, TERM_CAP) : 84
  const min = Number.isInteger(minTermMonths) ? Math.min(minTermMonths, max) : 12
  const terms = []
  for (let months = 12; months <= max; months += 12) if (months >= min) terms.push(months)
  return terms.length > 0 ? terms : [max]
}

/** Số nguyên trong [min, max], không trùng, tăng dần; không phải mảng → []. */
const cleanIntList = (list, min, max) => (Array.isArray(list)
  ? [...new Set(list.filter((value) => Number.isInteger(value) && value >= min && value <= max))].sort((a, b) => a - b)
  : [])

/** Các mức trả trước nhanh mặc định (khi admin chưa đặt): mức tối thiểu rồi 40/50/70 %. */
export const defaultDownOptions = (downMin) => [downMin, ...[40, 50, 70].filter((pct) => pct > downMin)]

/** "24 tháng (2 năm)"; số tháng lẻ năm → "18 tháng". */
export const termLabel = (months) => (months % 12 === 0 ? `${months} tháng (${months / 12} năm)` : `${months} tháng`)

/**
 * @typedef {object} LoanConfig
 * @property {object[]} banks       Ngân hàng đang hiện: liên kết trước, còn lại theo lãi ưu đãi tăng dần.
 * @property {object} partner
 * @property {number} downMin       Trả trước tối thiểu (% giá xe).
 * @property {number[]} terms       Thời hạn khách chọn được (admin đặt).
 * @property {number[]} downOptions Các nút trả trước nhanh (% giá xe, admin đặt).
 * @property {string|null} updatedAt
 */

/**
 * @param {object|null|undefined} raw  `data` của GET /settings/loan.
 * @returns {LoanConfig}
 */
export function normalizeLoanSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : FALLBACK_LOAN_SETTINGS
  let banks = (Array.isArray(source.banks) ? source.banks : []).map(cleanBank).filter((bank) => bank?.active)
  if (!banks.some((bank) => bank.isPartner)) banks = FALLBACK_LOAN_SETTINGS.banks.map(cleanBank)
  const partner = banks.find((bank) => bank.isPartner)
  const others = banks.filter((bank) => bank !== partner).sort((a, b) => a.promoRate - b.promoRate)
  const pct = Number(source.minDownPaymentPct)
  const downMin = Number.isFinite(pct) ? Math.min(Math.max(Math.round(pct), 0), DOWN_MAX - 1) : FALLBACK_LOAN_SETTINGS.minDownPaymentPct
  const terms = cleanIntList(source.termOptions, 1, TERM_CAP)
  const downOptions = cleanIntList(source.downPaymentOptions, downMin, DOWN_MAX)
  return {
    banks: [partner, ...others],
    partner,
    downMin,
    terms: terms.length > 0 ? terms : termOptions(source.minTermMonths, source.maxTermMonths),
    downOptions: downOptions.length > 0 ? downOptions : defaultDownOptions(downMin),
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null,
  }
}

/** Cấu hình dự phòng (dùng ngay khi trang mở, trước khi máy chủ trả lời). */
export const FALLBACK_CONFIG = normalizeLoanSettings(FALLBACK_LOAN_SETTINGS)

/** Luật nhập mặc định khi không có cấu hình (giữ hành vi cũ). */
export const DEFAULT_RULES = Object.freeze({ downMin: FALLBACK_CONFIG.downMin, terms: TERMS })

/** "27/11/2026" từ chuỗi ISO; null nếu không có. */
export const formatUpdatedAt = (iso) => {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })
}
