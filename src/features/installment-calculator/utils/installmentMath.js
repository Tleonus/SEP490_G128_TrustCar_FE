import { METHOD_ANNUITY } from '../constants/installmentConstants'

// Công thức tính trả góp (số nguyên đồng). Ref: .sdd/features/installment-calculator/SPEC.md mục 5.
// Một mức lãi cho cả kỳ vay (lãi ưu đãi của ngân hàng). Lãi thả nổi sau ưu đãi không tính vì ngân hàng không
// công bố trước được.

const toRate = (ratePercent) => ratePercent / 12 / 100

/** Một dòng lịch: dư nợ đầu kỳ, gốc, lãi, tổng trả, dư nợ cuối kỳ. */
const makeRow = (period, opening, principal, interest) => ({
  period,
  opening,
  principal,
  interest,
  payment: principal + interest,
  closing: opening - principal,
})

/**
 * Dư nợ giảm dần: gốc mỗi kỳ `floor(vay / n)`, kỳ cuối bù phần dư; lãi tính trên dư nợ đầu kỳ.
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F06
 */
export function buildReducing(loan, termMonths, ratePercent) {
  const rate = toRate(ratePercent)
  const base = Math.floor(loan / termMonths)
  const rows = []
  let balance = loan
  for (let period = 1; period <= termMonths; period += 1) {
    const principal = period === termMonths ? balance : base
    rows.push(makeRow(period, balance, principal, Math.round(balance * rate)))
    balance -= principal
  }
  return rows
}

/** Số tiền trả đều mỗi kỳ của niên kim (đồng, đã làm tròn). */
export function annuityPayment(loan, termMonths, ratePercent) {
  const rate = toRate(ratePercent)
  if (rate === 0) return Math.round(loan / termMonths)
  return Math.round((loan * rate) / (1 - (1 + rate) ** -termMonths))
}

/**
 * Niên kim cố định: trả đều mỗi kỳ; kỳ cuối trả hết dư nợ còn lại.
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F06
 */
export function buildAnnuity(loan, termMonths, ratePercent) {
  const rate = toRate(ratePercent)
  const payment = annuityPayment(loan, termMonths, ratePercent)
  const rows = []
  let balance = loan
  for (let period = 1; period <= termMonths; period += 1) {
    const interest = Math.round(balance * rate)
    const principal = period === termMonths ? balance : Math.min(balance, Math.max(0, payment - interest))
    rows.push(makeRow(period, balance, principal, interest))
    balance -= principal
  }
  return rows
}

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0)

/**
 * Kết quả đầy đủ cho một bộ thông số HỢP LỆ (xem `validateInput`).
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F05
 * `downAmount` (số tiền khách có, đã hợp lệ) thay cho `downPercent` khi có.
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F18
 * @param {{ price: number, downPercent: number, downAmount?: number|null, termMonths: number, ratePercent: number,
 *   method: string }} input
 */
export function computeInstallment({ price, downPercent, downAmount = null, termMonths, ratePercent, method }) {
  const down = typeof downAmount === 'number' ? downAmount : Math.round((price * downPercent) / 100)
  const loan = price - down
  const rows = method === METHOD_ANNUITY
    ? buildAnnuity(loan, termMonths, ratePercent)
    : buildReducing(loan, termMonths, ratePercent)
  const totalInterest = sum(rows, 'interest')
  return {
    down,
    downShare: Math.round((down * 1000) / price) / 10, // % giá xe, 1 chữ số thập phân
    loan,
    rows,
    totalInterest,
    totalRepay: loan + totalInterest,
    totalCost: down + loan + totalInterest,
    firstPayment: rows[0].payment,
    lastPayment: rows[rows.length - 1].payment,
  }
}
