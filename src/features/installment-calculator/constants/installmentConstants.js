// Hằng số của trang "Tính trả góp" (KAN-61).
// Ref: .sdd/features/installment-calculator/SPEC.md (REQ-F03, REQ-F08, mục 6)

/** Giá xe cho phép (đồng). */
export const PRICE_MIN = 10_000_000
export const PRICE_MAX = 100_000_000_000

/** Lãi suất năm cho phép (%). */
export const RATE_MIN = 0
export const RATE_MAX = 40

/** Trả trước (% giá xe): vay tối đa 70 % → trả trước tối thiểu 30 %. */
export const DOWN_MIN = 30
export const DOWN_MAX = 90
export const MAX_LOAN_PERCENT = 100 - DOWN_MIN

/** Thời hạn vay (tháng): 1–7 năm. */
export const TERMS = [12, 24, 36, 48, 60, 72, 84]

export const METHOD_REDUCING = 'REDUCING'
export const METHOD_ANNUITY = 'ANNUITY'
export const METHODS = [
  { value: METHOD_REDUCING, label: 'Dư nợ giảm dần' },
  { value: METHOD_ANNUITY, label: 'Niên kim cố định' },
]

export const DEFAULTS = Object.freeze({
  price: 800_000_000,
  downPercent: 30,
  termMonths: 60,
  ratePercent: 9,
  method: METHOD_REDUCING,
})

export const PAGE_SIZE = 12

export const MESSAGES = Object.freeze({
  priceNaN: 'Nhập giá xe bằng số.',
  priceRange: 'Giá xe phải từ 10.000.000 đ đến 100.000.000.000 đ.',
  rateNaN: 'Nhập lãi suất bằng số.',
  rateRange: 'Lãi suất phải từ 0 đến 40 %/năm.',
})
