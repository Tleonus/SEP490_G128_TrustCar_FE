import { describe, it, expect } from 'vitest'
import { initialInput, parsePriceParam, validateInput } from './installmentInput'
import { DEFAULTS, MESSAGES, METHOD_ANNUITY } from '../constants/installmentConstants'

describe('validateInput (AC-F04)', () => {
  it('giá trị mặc định hợp lệ', () => {
    const result = validateInput(DEFAULTS)
    expect(result.ok).toBe(true)
    expect(result.value).toEqual(DEFAULTS)
  })

  it.each([
    [null, MESSAGES.priceNaN],
    [undefined, MESSAGES.priceNaN],
    [Number.NaN, MESSAGES.priceNaN],
    ['800000000', MESSAGES.priceNaN],
    [9_999_999, MESSAGES.priceRange],
    [100_000_000_001, MESSAGES.priceRange],
    [-5, MESSAGES.priceRange],
  ])('giá %p → "%s"', (price, message) => {
    const result = validateInput({ ...DEFAULTS, price })
    expect(result.ok).toBe(false)
    expect(result.errors.price).toBe(message)
    expect(result.value).toBeNull()
  })

  it('biên giá hợp lệ: 10 triệu và 100 tỷ', () => {
    expect(validateInput({ ...DEFAULTS, price: 10_000_000 }).ok).toBe(true)
    expect(validateInput({ ...DEFAULTS, price: 100_000_000_000 }).ok).toBe(true)
  })

  it.each([
    [null, MESSAGES.rateNaN],
    [Number.NaN, MESSAGES.rateNaN],
    [-0.01, MESSAGES.rateRange],
    [40.01, MESSAGES.rateRange],
  ])('lãi %p → "%s"', (ratePercent, message) => {
    const result = validateInput({ ...DEFAULTS, ratePercent })
    expect(result.ok).toBe(false)
    expect(result.errors.ratePercent).toBe(message)
  })

  it('lãi 0 và 40 hợp lệ; làm tròn 2 chữ số thập phân', () => {
    expect(validateInput({ ...DEFAULTS, ratePercent: 0 }).ok).toBe(true)
    expect(validateInput({ ...DEFAULTS, ratePercent: 40 }).ok).toBe(true)
    expect(validateInput({ ...DEFAULTS, ratePercent: 8.456 }).value.ratePercent).toBe(8.46)
  })

  it('cả hai lỗi cùng lúc', () => {
    const result = validateInput({ ...DEFAULTS, price: null, ratePercent: 99 })
    expect(Object.keys(result.errors).sort()).toEqual(['price', 'ratePercent'])
  })

  it('các ô còn lại luôn được ép về giá trị hợp lệ', () => {
    const value = validateInput({ ...DEFAULTS, downPercent: 5, termMonths: 7, method: 'x' }).value
    expect(value).toMatchObject({ downPercent: 30, termMonths: 60, method: DEFAULTS.method })
    expect(validateInput({ ...DEFAULTS, downPercent: 99, method: METHOD_ANNUITY }).value).toMatchObject({ downPercent: 90, method: METHOD_ANNUITY })
  })
})

describe('parsePriceParam / initialInput (AC-F05)', () => {
  it('đọc số nguyên hợp lệ', () => {
    expect(parsePriceParam('?price=1200000000')).toBe(1_200_000_000)
    expect(initialInput('?price=1200000000').price).toBe(1_200_000_000)
  })

  it.each(['', '?', '?price=', '?price=abc', '?price=-5', '?price=1e9', '?price=1.5', '?price=1.200.000.000', '?price=5000000', '?price=200000000000', '?price=0x10', '?other=1'])(
    'bỏ qua "%s" (dùng mặc định)', (search) => {
      expect(parsePriceParam(search)).toBeNull()
      expect(initialInput(search)).toEqual(DEFAULTS)
    },
  )

  it('không lỗi khi thiếu tham số', () => {
    expect(parsePriceParam(undefined)).toBeNull()
  })
})
