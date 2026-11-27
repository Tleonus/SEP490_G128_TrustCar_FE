// Form "Lãi suất trả góp" (admin): chuyển dữ liệu GET /settings/loan ⇄ form, kiểm tra trước khi gửi.
// Luật khớp với BE (src/routes/loanSettingsSchemas.js); BE vẫn kiểm lại lần cuối.
import { defaultDownOptions, termOptions as termsInRange } from '../utils/loanConfig'

export const MAX_BANKS = 10
export const RATE_MAX = 40
export const DOWN_MIN_RANGE = [0, 90]
export const TERM_OPTION_RANGE = [1, 120]
export const MAX_TERM_OPTIONS = 12
export const MAX_DOWN_OPTIONS = 8

const isNum = (value) => typeof value === 'number' && Number.isFinite(value)
const isEmpty = (value) => value === null || value === undefined || value === ''
const text = (value) => (typeof value === 'string' ? value : '')
const intList = (list) => (Array.isArray(list) ? [...new Set(list.filter(Number.isInteger))].sort((a, b) => a - b) : [])

/** Một dòng ngân hàng của form (giữ `key` ổn định để React không lẫn ô khi xoá/thêm). */
const toBankRow = (bank, index) => ({
  key: `${bank.id ?? 'NEW'}-${index}`,
  id: text(bank.id),
  name: text(bank.name),
  isPartner: bank.isPartner === true,
  active: bank.active !== false,
  promoRate: isNum(bank.promoRate) ? bank.promoRate : null,
  maxLoanPct: Number.isInteger(bank.maxLoanPct) ? bank.maxLoanPct : null,
  minLoanAmount: Number.isInteger(bank.minLoanAmount) ? bank.minLoanAmount : null,
  minTermMonths: Number.isInteger(bank.minTermMonths) ? bank.minTermMonths : null,
  maxTermMonths: Number.isInteger(bank.maxTermMonths) ? bank.maxTermMonths : null,
  note: text(bank.note),
  cars: text(bank.cars),
  sourceUrl: text(bank.sourceUrl),
  sourceDate: text(bank.sourceDate),
})

/** @param {object} raw  `data` của GET /settings/loan. */
export const toForm = (raw) => {
  const minDownPaymentPct = isNum(raw?.minDownPaymentPct) ? raw.minDownPaymentPct : 30
  const terms = intList(raw?.termOptions)
  const downs = intList(raw?.downPaymentOptions)
  return {
    minDownPaymentPct,
    termOptions: terms.length > 0 ? terms : termsInRange(raw?.minTermMonths, raw?.maxTermMonths),
    downPaymentOptions: downs.length > 0 ? downs : defaultDownOptions(minDownPaymentPct),
    banks: (Array.isArray(raw?.banks) ? raw.banks : []).map(toBankRow),
  }
}

/**
 * Số khách đang thấy khi ô điều kiện của một ngân hàng để trống (quy định chung).
 * @returns {{ maxLoanPct: number|null, minTermMonths: number|null, maxTermMonths: number|null }}
 */
export const generalRules = (form) => ({
  maxLoanPct: isNum(form.minDownPaymentPct) ? 100 - form.minDownPaymentPct : null,
  minTermMonths: form.termOptions[0] ?? null,
  maxTermMonths: form.termOptions[form.termOptions.length - 1] ?? null,
})

/** Mã ngân hàng từ tên: "Vietcombank 2" → "VIETCOMBANK2", bỏ dấu, không trùng mã đã có. */
export function makeBankId(name, takenIds) {
  const base = text(name).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D')
    .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || 'BANK'
  let id = base.length >= 2 ? base : `${base}X`
  for (let n = 2; takenIds.includes(id); n += 1) id = `${base.slice(0, 16)}${n}`
  return id
}

/** Dòng mới từ ngân hàng chọn trong danh sách (vnBanks.js); lãi để trống cho admin nhập. */
export const newBankRow = ({ id, name }) => toBankRow({ id, name, isPartner: false, active: true }, `new-${Date.now()}`)

const rangeError = (value, [min, max], label, integer = false) => {
  if (!isNum(value)) return `Nhập ${label}.`
  if (integer && !Number.isInteger(value)) return `${label[0].toUpperCase()}${label.slice(1)} phải là số nguyên.`
  return value < min || value > max ? `${label[0].toUpperCase()}${label.slice(1)} phải từ ${min} đến ${max}.` : null
}

/** Ô số không bắt buộc: trống thì bỏ qua, có thì phải trong khoảng. */
const optionalRange = (errors, field, value, bounds, label, integer = false) => {
  if (isEmpty(value)) return
  const error = rangeError(value, bounds, label, integer)
  if (error) errors[field] = error
}

const bankErrors = (bank) => {
  const errors = {}
  if (!bank.name.trim()) errors.name = 'Thiếu tên ngân hàng.'
  const rate = rangeError(bank.promoRate, [0, RATE_MAX], 'lãi suất')
  if (rate) errors.promoRate = rate
  optionalRange(errors, 'maxLoanPct', bank.maxLoanPct, [1, 100], 'tỷ lệ cho vay tối đa', true)
  optionalRange(errors, 'minLoanAmount', bank.minLoanAmount, [0, 100_000_000_000], 'số tiền vay tối thiểu', true)
  optionalRange(errors, 'minTermMonths', bank.minTermMonths, [1, 360], 'thời hạn tối thiểu', true)
  optionalRange(errors, 'maxTermMonths', bank.maxTermMonths, [1, 360], 'thời hạn tối đa', true)
  if (!errors.minTermMonths && !errors.maxTermMonths && isNum(bank.minTermMonths) && isNum(bank.maxTermMonths)
    && bank.minTermMonths > bank.maxTermMonths) {
    errors.maxTermMonths = 'Thời hạn tối đa không được nhỏ hơn thời hạn tối thiểu.'
  }
  if (bank.sourceUrl.trim() && !/^https?:\/\/\S+$/i.test(bank.sourceUrl.trim())) errors.sourceUrl = 'Link nguồn phải bắt đầu bằng http:// hoặc https://.'
  if (bank.id && !/^[A-Z0-9_-]{2,20}$/.test(bank.id)) errors.id = 'Mã chỉ gồm chữ in hoa, số, "_" hoặc "-", dài 2–20 ký tự.'
  return errors
}

const generalErrors = (form) => {
  const general = {}
  const down = rangeError(form.minDownPaymentPct, DOWN_MIN_RANGE, 'trả trước tối thiểu')
  if (down) general.minDownPaymentPct = down
  if (form.termOptions.length === 0) general.termOptions = 'Cần ít nhất 1 thời hạn vay.'
  else if (form.termOptions.length > MAX_TERM_OPTIONS) general.termOptions = `Tối đa ${MAX_TERM_OPTIONS} thời hạn vay.`
  if (form.downPaymentOptions.length === 0) general.downPaymentOptions = 'Cần ít nhất 1 mức trả trước.'
  else if (form.downPaymentOptions.length > MAX_DOWN_OPTIONS) general.downPaymentOptions = `Tối đa ${MAX_DOWN_OPTIONS} mức trả trước.`
  else if (!down) {
    const low = form.downPaymentOptions.filter((pct) => pct < form.minDownPaymentPct)
    if (low.length > 0) general.downPaymentOptions = `Mức ${low.join('%, ')}% thấp hơn trả trước tối thiểu ${form.minDownPaymentPct}%: bỏ đi hoặc hạ mức tối thiểu.`
  }
  return general
}

/**
 * @returns {{ ok: boolean, general: object, banks: object[], list: string|null }}
 *   `general`: lỗi trả trước/thời hạn/các lựa chọn; `banks[i]`: lỗi từng ô của ngân hàng i; `list`: lỗi của cả danh sách.
 */
export function validateForm(form) {
  const general = generalErrors(form)
  const banks = form.banks.map(bankErrors)
  const partners = form.banks.filter((bank) => bank.isPartner)
  const ids = form.banks.map((bank) => bank.id).filter(Boolean)
  let list = null
  if (form.banks.length === 0) list = 'Cần ít nhất 1 ngân hàng.'
  else if (form.banks.length > MAX_BANKS) list = `Tối đa ${MAX_BANKS} ngân hàng.`
  else if (partners.length !== 1) list = 'Chọn đúng 1 ngân hàng liên kết showroom.'
  else if (!partners[0].active) list = 'Ngân hàng liên kết phải đang hiện trên trang tính.'
  else if (new Set(ids).size !== ids.length) list = 'Mã ngân hàng bị trùng.'

  const ok = Object.keys(general).length === 0 && banks.every((item) => Object.keys(item).length === 0) && !list
  return { ok, general, banks, list }
}

const numOrNull = (value) => (isEmpty(value) ? null : value)

/** Thân PUT /settings/loan. Ngân hàng chưa có mã → tạo từ tên. Thời hạn ngắn/dài nhất do BE suy ra từ danh sách. */
export function toPayload(form) {
  const taken = form.banks.map((bank) => bank.id).filter(Boolean)
  const banks = form.banks.map((bank) => {
    const id = bank.id || makeBankId(bank.name, taken)
    if (!bank.id) taken.push(id)
    return {
      id,
      name: bank.name.trim(),
      isPartner: bank.isPartner,
      active: bank.active,
      promoRate: bank.promoRate,
      maxLoanPct: numOrNull(bank.maxLoanPct),
      minLoanAmount: numOrNull(bank.minLoanAmount),
      minTermMonths: numOrNull(bank.minTermMonths),
      maxTermMonths: numOrNull(bank.maxTermMonths),
      note: bank.note.trim(),
      cars: bank.cars.trim(),
      sourceUrl: bank.sourceUrl.trim(),
      sourceDate: bank.sourceDate.trim(),
    }
  })
  return {
    minDownPaymentPct: form.minDownPaymentPct,
    termOptions: intList(form.termOptions),
    downPaymentOptions: intList(form.downPaymentOptions),
    banks,
  }
}

/** So sánh để bật/tắt nút Lưu (bỏ `key` vì chỉ dùng cho React). */
export const sameForm = (a, b) => JSON.stringify(toPayload(a)) === JSON.stringify(toPayload(b))
