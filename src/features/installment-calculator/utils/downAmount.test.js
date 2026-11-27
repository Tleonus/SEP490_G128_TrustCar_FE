import { describe, expect, it } from 'vitest'
import { DEFAULTS } from '../constants/installmentConstants'
import { digitsOnly, groupDigits, maxPriceFor, minDownAmount, validateInput } from './installmentInput'
import { computeInstallment } from './installmentMath'
import { compareBanks } from './bankCompare'
import { FALLBACK_CONFIG } from './loanConfig'

// REQ-F18: khách nhập số tiền đang có → trả trước = số đó, vay = giá xe − số đó.
const PRICE = 800_000_000
const input = (downAmount, extra = {}) => ({ ...DEFAULTS, price: PRICE, downMode: 'AMOUNT', downAmount, ...extra })

describe('Số tiền bạn có (REQ-F18)', () => {
  it('trả trước đúng bằng số tiền nhập, vay phần còn lại', () => {
    const checked = validateInput(input(300_000_000))
    expect(checked.ok).toBe(true)
    const result = computeInstallment(checked.value)
    expect(result.down).toBe(300_000_000)
    expect(result.loan).toBe(500_000_000)
    expect(result.downShare).toBe(37.5)
    expect(result.totalCost).toBe(PRICE + result.totalInterest)
  })

  it('ô trống → tạm tính theo % đang chọn', () => {
    const checked = validateInput(input(null, { downPercent: 40 }))
    expect(checked.value.downAmount).toBeNull()
    expect(computeInstallment(checked.value).down).toBe(320_000_000)
  })

  it('dưới 30 % giá xe → báo cần ít nhất bao nhiêu và còn thiếu bao nhiêu, không hiện số', () => {
    const checked = validateInput(input(200_000_000))
    expect(checked.ok).toBe(false)
    expect(checked.errors.downAmount).toMatch(/ít nhất 240\.000\.000.*thiếu 40\.000\.000/)
  })

  it('đủ hoặc hơn giá xe → không cần vay', () => {
    expect(validateInput(input(PRICE)).errors.downAmount).toMatch(/mua thẳng/)
    expect(validateInput(input(900_000_000)).errors.downAmount).toMatch(/mua thẳng/)
  })

  it('số âm → báo nhập số; chế độ % thì bỏ qua ô số tiền', () => {
    expect(validateInput(input(-5)).errors.downAmount).toBeTruthy()
    expect(validateInput(input(1, { downMode: 'PERCENT' })).ok).toBe(true)
  })

  it('số tiền tối thiểu và giá xe cao nhất mua được', () => {
    expect(minDownAmount(PRICE)).toBe(240_000_000)
    expect(maxPriceFor(300_000_000)).toBe(1_000_000_000)
  })

  it('bảng so sánh ngân hàng cũng dùng số tiền khách có', () => {
    const rows = compareBanks(validateInput(input(300_000_000)).value, FALLBACK_CONFIG.banks)
    expect(rows.every((row) => row.estimate.firstPayment > 0)).toBe(true)
    const partner = computeInstallment({ ...validateInput(input(300_000_000)).value, ratePercent: FALLBACK_CONFIG.partner.promoRate })
    expect(rows[0].estimate.firstPayment).toBe(partner.firstPayment)
  })
})

describe('ô số tiền: tách nghìn', () => {
  it('300000000 ↔ 300.000.000', () => {
    expect(groupDigits(300_000_000)).toBe('300.000.000')
    expect(groupDigits(null)).toBe('')
    expect(digitsOnly('300.000.000 đ')).toBe('300000000')
  })
})
