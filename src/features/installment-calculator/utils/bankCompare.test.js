import { describe, expect, it } from 'vitest'
import { compareBanks } from './bankCompare'
import { computeInstallment } from './installmentMath'
import { FALLBACK_LOAN_SETTINGS, bankRateFields, formatRate } from '../constants/bankRates'
import { DEFAULTS, METHOD_ANNUITY } from '../constants/installmentConstants'
import { FALLBACK_CONFIG } from './loanConfig'

const input = { price: 800_000_000, downPercent: 30, termMonths: 60, method: 'REDUCING' }
const bank = (id) => FALLBACK_LOAN_SETTINGS.banks.find((item) => item.id === id)

describe('compareBanks (REQ-F15)', () => {
  it('ước tính đúng theo lãi ưu đãi của từng ngân hàng, cùng khoản vay', () => {
    const [tp, msb] = compareBanks(input, [bank('TPBANK'), bank('MSB')])
    const expected = computeInstallment({ ...input, ratePercent: 8.2 })
    expect(tp.estimate).toEqual({ firstPayment: expected.firstPayment, lastPayment: expected.lastPayment, totalInterest: expected.totalInterest })
    expect(msb.estimate.firstPayment).toBe(computeInstallment({ ...input, ratePercent: 7.5 }).firstPayment)
  })

  it('mọi ngân hàng dùng một mức lãi ưu đãi cho cả kỳ vay (không tính lãi sau ưu đãi)', () => {
    const [pv] = compareBanks(input, [bank('PVCOMBANK')])
    expect(pv.estimate.totalInterest).toBe(computeInstallment({ ...input, ratePercent: 9.5 }).totalInterest)
  })

  it('ngân hàng không có lãi suất → không có ước tính (không đoán số)', () => {
    expect(compareBanks(input, [{ id: 'X', promoRate: null }])[0].estimate).toBeNull()
  })

  it('thông số chưa hợp lệ (input null) → không có ước tính nào', () => {
    expect(compareBanks(null, FALLBACK_CONFIG.banks).every((item) => item.estimate === null)).toBe(true)
  })

  it('niên kim: tháng đầu = tháng thường', () => {
    const [tp] = compareBanks({ ...input, method: METHOD_ANNUITY }, [bank('TPBANK')])
    expect(tp.estimate.firstPayment).toBe(computeInstallment({ ...input, method: METHOD_ANNUITY, ratePercent: 8.2 }).firstPayment)
  })
})

describe('dữ liệu ngân hàng dự phòng (REQ-F13, REQ-F16)', () => {
  it('đúng 1 ngân hàng liên kết (TPBank); lãi mặc định của trang = lãi ưu đãi TPBank', () => {
    expect(FALLBACK_LOAN_SETTINGS.banks.filter((item) => item.isPartner).map((item) => item.id)).toEqual(['TPBANK'])
    expect(DEFAULTS.ratePercent).toBe(bank('TPBANK').promoRate)
  })

  it('mọi ngân hàng có nguồn https đúng tên miền chính thức, kèm ngày', () => {
    const domains = { TPBANK: 'tpb.vn', MSB: 'msb.com.vn', PVCOMBANK: 'pvcombank.com.vn', HLBANK: 'hlbank.com.vn' }
    FALLBACK_LOAN_SETTINGS.banks.forEach((item) => {
      const url = new URL(item.sourceUrl)
      expect(url.protocol).toBe('https:')
      expect(url.hostname.endsWith(domains[item.id])).toBe(true)
      expect(item.sourceDate).toBeTruthy()
    })
  })

  it('không trùng id; formatRate dùng dấu phẩy', () => {
    const ids = FALLBACK_LOAN_SETTINGS.banks.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(formatRate(8.99)).toBe('8,99')
  })

  it('thông số cho trang tính: chỉ lãi ưu đãi', () => {
    expect(bankRateFields(bank('PVCOMBANK'))).toEqual({ ratePercent: 9.5 })
    expect(bankRateFields(bank('HLBANK'))).toEqual({ ratePercent: 10.59 })
  })
})
