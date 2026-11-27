import { computeInstallment } from './installmentMath'
import { bankRateFields } from '../constants/bankRates'

/**
 * Ước tính cùng một khoản vay (giá, trả trước, thời hạn, cách tính) theo lãi của từng ngân hàng: lãi ưu đãi,
 * và lãi sau ưu đãi khi ngân hàng có công bố. Ngân hàng không có lãi suất → `estimate: null` (không đoán số).
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F15
 * @param {{ price: number, downPercent: number, termMonths: number, method: string }|null} input  Đã hợp lệ.
 * @param {Array<{ id: string, promoRate: number|null }>} banks
 * @returns {Array<{ bank: object, estimate: { firstPayment: number, lastPayment: number, totalInterest: number }|null }>}
 */
export function compareBanks(input, banks) {
  return banks.map((bank) => {
    if (!input || typeof bank.promoRate !== 'number') return { bank, estimate: null }
    const { firstPayment, lastPayment, totalInterest } = computeInstallment({ ...input, ...bankRateFields(bank) })
    return { bank, estimate: { firstPayment, lastPayment, totalInterest } }
  })
}
