import { describe, it, expect } from 'vitest'
import { buildInstallmentLink, initialInput, isWidgetPrice, parsePriceParam, parseQueryParams, validateInput } from './installmentInput'
import { DEFAULTS, MESSAGES, METHOD_ANNUITY } from '../constants/installmentConstants'

describe('validateInput (AC-F04)', () => {
  it('giá trị mặc định hợp lệ', () => {
    const result = validateInput(DEFAULTS)
    expect(result.ok).toBe(true)
    const { downMode, ...expected } = DEFAULTS // cách nhập không nằm trong kết quả đã kiểm
    expect(downMode).toBe('AMOUNT')
    expect(result.value).toEqual(expected)
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

describe('parseQueryParams / initialInput mở rộng (KAN-62 REQ-F08)', () => {
  it('đọc đủ giá, trả trước, thời hạn, lãi', () => {
    const search = '?price=800000000&down=40&term=36&rate=8.5'
    expect(parseQueryParams(search)).toEqual({ price: 800_000_000, downPercent: 40, termMonths: 36, ratePercent: 8.5 })
    // có ?down= (từ khối ở trang chi tiết xe) → giữ cách nhập theo %
    expect(initialInput(search)).toEqual({ ...DEFAULTS, price: 800_000_000, downPercent: 40, termMonths: 36, ratePercent: 8.5, downMode: 'PERCENT' })
    expect(initialInput('?price=800000000').downMode).toBe('AMOUNT')
  })

  it.each([
    ['?down=29'], ['?down=91'], ['?down=abc'], ['?down=-5'], ['?down=1.5'], ['?down='],
    ['?term=7'], ['?term=13'], ['?term=96'], ['?term=x'],
    ['?rate=41'], ['?rate=-1'], ['?rate=abc'], ['?rate=8.555'], ['?rate='], ['?rate=1e1'],
  ])('bỏ qua tham số sai "%s"', (search) => {
    expect(parseQueryParams(search)).toEqual({})
    expect(initialInput(search)).toEqual(DEFAULTS)
  })

  it('biên hợp lệ: down 30 và 90, term 12 và 84, rate 0 và 40', () => {
    expect(parseQueryParams('?down=30&term=12&rate=0')).toEqual({ downPercent: 30, termMonths: 12, ratePercent: 0 })
    expect(parseQueryParams('?down=90&term=84&rate=40')).toEqual({ downPercent: 90, termMonths: 84, ratePercent: 40 })
  })

  it('tham số sai không làm hỏng tham số đúng', () => {
    expect(parseQueryParams('?price=1200000000&down=5&term=48')).toEqual({ price: 1_200_000_000, termMonths: 48 })
  })

  it('kết quả luôn qua validateInput', () => {
    ;['?price=500000000&down=50&term=24&rate=10', '?down=90&term=84&rate=40', '?price=10000000'].forEach((search) => {
      expect(validateInput(initialInput(search)).ok).toBe(true)
    })
  })
})

describe('isWidgetPrice / buildInstallmentLink (KAN-62)', () => {
  it.each([[800_000_000, true], [10_000_000, true], [100_000_000_000, true], [9_999_999, false], [100_000_000_001, false], [null, false], [undefined, false], [Number.NaN, false], ['800000000', false], [0, false]])(
    'giá %p → %p', (price, expected) => { expect(isWidgetPrice(price)).toBe(expected) },
  )

  it('đường dẫn mang giá, trả trước, thời hạn và được trang tính đọc lại đúng', () => {
    const link = buildInstallmentLink({ price: 800_000_000, downPercent: 40, termMonths: 36 })
    expect(link).toBe('/installment?price=800000000&down=40&term=36')
    expect(initialInput(link.slice(link.indexOf('?')))).toMatchObject({ price: 800_000_000, downPercent: 40, termMonths: 36 })
  })

  it('làm tròn giá lẻ', () => {
    expect(buildInstallmentLink({ price: 799_999_999.6, downPercent: 30, termMonths: 60 })).toBe('/installment?price=800000000&down=30&term=60')
  })
})
