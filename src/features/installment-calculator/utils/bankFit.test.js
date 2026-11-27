import { describe, expect, it } from 'vitest'
import { bankFit, loanOf } from './bankFit'
import { formatPrice } from '../../../utils/format'

const hl = { maxLoanPct: 80, minLoanAmount: 300_000_000, minTermMonths: 48, maxTermMonths: 60 }

describe('bankFit — điều kiện vay của ngân hàng', () => {
  it('khoản vay hợp → không có cảnh báo', () => {
    expect(bankFit(hl, { price: 1_000_000_000, loan: 700_000_000, termMonths: 60 })).toEqual([])
  })

  it('vay quá tỷ lệ, dưới mức tối thiểu, thời hạn ngoài khoảng → từng câu một', () => {
    expect(bankFit(hl, { price: 365_000_000, loan: 255_500_000, termMonths: 36 })).toEqual([
      `vay tối thiểu ${formatPrice(300_000_000)}`,
      'thời hạn tối thiểu 48 tháng',
    ])
    expect(bankFit(hl, { price: 1_000_000_000, loan: 850_000_000, termMonths: 72 })).toEqual([
      'cho vay tối đa 80% giá xe (đang vay 85%)',
      'thời hạn tối đa 60 tháng',
    ])
  })

  it('ngân hàng không đặt điều kiện hoặc chưa có khoản vay → []', () => {
    expect(bankFit({}, { price: 1, loan: 1, termMonths: 12 })).toEqual([])
    expect(bankFit(hl, null)).toEqual([])
  })

  it('loanOf: dùng số tiền khách có nếu có, không thì theo %', () => {
    expect(loanOf({ price: 800_000_000, downPercent: 30, downAmount: null, termMonths: 60 })).toEqual({ price: 800_000_000, loan: 560_000_000, termMonths: 60 })
    expect(loanOf({ price: 800_000_000, downPercent: 30, downAmount: 300_000_000, termMonths: 60 }).loan).toBe(500_000_000)
  })
})
