import { formatPrice } from '../../../utils/format'

// Điều kiện vay của từng ngân hàng (admin nhập): khoản vay đang tính có hợp không. Chỉ cảnh báo, không chặn —
// ngân hàng là bên quyết định cuối cùng.

/**
 * @param {object} bank  Ngân hàng đã chuẩn hoá (loanConfig.js).
 * @param {{ price: number, loan: number, termMonths: number }|null} loan  Khoản vay đang tính.
 * @returns {string[]}  Các điều kiện không đạt, câu ngắn; [] nếu hợp hoặc chưa có khoản vay.
 */
export function bankFit(bank, loan) {
  if (!bank || !loan || !(loan.price > 0)) return []
  const problems = []
  const share = (loan.loan * 100) / loan.price
  if (bank.maxLoanPct && share > bank.maxLoanPct + 1e-9) {
    problems.push(`cho vay tối đa ${bank.maxLoanPct}% giá xe (đang vay ${String(Math.round(share * 10) / 10).replace('.', ',')}%)`)
  }
  if (bank.minLoanAmount && loan.loan < bank.minLoanAmount) problems.push(`vay tối thiểu ${formatPrice(bank.minLoanAmount)}`)
  if (bank.minTermMonths && loan.termMonths < bank.minTermMonths) problems.push(`thời hạn tối thiểu ${bank.minTermMonths} tháng`)
  if (bank.maxTermMonths && loan.termMonths > bank.maxTermMonths) problems.push(`thời hạn tối đa ${bank.maxTermMonths} tháng`)
  return problems
}

/** Khoản vay để xét điều kiện, từ thông số đã hợp lệ của trang tính. */
export const loanOf = (input) => {
  if (!input) return null
  const down = typeof input.downAmount === 'number' ? input.downAmount : Math.round((input.price * input.downPercent) / 100)
  return { price: input.price, loan: input.price - down, termMonths: input.termMonths }
}
