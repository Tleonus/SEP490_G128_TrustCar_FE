import { describe, expect, it } from 'vitest'
import {
  buildPriceHistoryEntries,
  changedByName,
  formatChangedAt,
  formatVnd,
  translateReason,
} from './priceHistoryTimeline'

const entry = (overrides) => ({
  price: 500_000_000,
  changedAt: '2026-11-01T09:15:00',
  changedBy: { fullName: 'Nguyễn Văn A', email: 'a@trustcar.vn' },
  reason: 'Initial intake price',
  ...overrides,
})

describe('formatVnd', () => {
  it('định dạng theo AC: 1.200.000.000 đ', () => {
    expect(formatVnd(1_200_000_000)).toBe('1.200.000.000 đ')
    expect(formatVnd(0)).toBe('0 đ')
  })

  it('trả gạch ngang cho giá trị thiếu', () => {
    expect(formatVnd(null)).toBe('—')
    expect(formatVnd(undefined)).toBe('—')
    expect(formatVnd('không phải số')).toBe('—')
  })
})

describe('formatChangedAt', () => {
  it('định dạng DD/MM/YYYY HH:mm', () => {
    expect(formatChangedAt(new Date(2026, 0, 5, 8, 7))).toBe('05/01/2026 08:07')
  })

  it('giữ số 0 ở đầu', () => {
    expect(formatChangedAt(new Date(2026, 10, 9, 0, 0))).toBe('09/11/2026 00:00')
  })

  it('trả gạch ngang cho ngày không hợp lệ', () => {
    expect(formatChangedAt(null)).toBe('—')
    expect(formatChangedAt('không phải ngày')).toBe('—')
  })
})

describe('translateReason', () => {
  it('dịch mã tự động giảm giá', () => {
    expect(translateReason('AUTO_MARKDOWN_CRITICAL')).toBe('Tự động giảm giá do tồn kho lâu')
    expect(translateReason('AUTO_MARKDOWN_AGING')).toContain('30–60 ngày')
    expect(translateReason('auto_markdown_fresh')).toContain('xe mới về kho')
  })

  it('dịch giá nhập kho ban đầu, không phân biệt hoa thường', () => {
    expect(translateReason('Initial intake price')).toBe('Giá nhập kho ban đầu')
    expect(translateReason('initial intake price')).toBe('Giá nhập kho ban đầu')
  })

  it('giữ nguyên lý do do người dùng tự nhập', () => {
    expect(translateReason('Chủ xe cần bán gấp')).toBe('Chủ xe cần bán gấp')
  })

  it('dùng nhãn riêng khi rỗng', () => {
    expect(translateReason(null)).toBe('Không ghi lý do')
    expect(translateReason(null, { isInitial: true })).toBe('Giá nhập kho ban đầu')
    expect(translateReason('   ')).toBe('Không ghi lý do')
  })
})

describe('changedByName', () => {
  it('ưu tiên fullName rồi email', () => {
    expect(changedByName({ changedBy: { fullName: 'Trần B', email: 'b@x.vn' } })).toBe('Trần B')
    expect(changedByName({ changedBy: { email: 'b@x.vn' } })).toBe('b@x.vn')
  })

  it('xử lý trường hợp thiếu người thay đổi', () => {
    expect(changedByName({})).toBe('Không xác định')
    expect(changedByName({ changedBy: null })).toBe('Không xác định')
    expect(changedByName({ changedBy: '6650f1a2b3c4d5e6f7a8b9c0' })).toBe('6650f1a2b3c4d5e6f7a8b9c0')
  })
})

describe('buildPriceHistoryEntries', () => {
  it('trả mảng rỗng khi không có lịch sử', () => {
    expect(buildPriceHistoryEntries([])).toEqual([])
    expect(buildPriceHistoryEntries(null)).toEqual([])
    expect(buildPriceHistoryEntries(undefined)).toEqual([])
  })

  it('mới nhất lên đầu', () => {
    const result = buildPriceHistoryEntries([
      entry({ price: 500_000_000, changedAt: '2026-10-01T08:00:00' }),
      entry({ price: 480_000_000, changedAt: '2026-11-10T08:00:00' }),
      entry({ price: 450_000_000, changedAt: '2026-09-01T08:00:00' }),
    ])
    expect(result.map((e) => e.newPrice)).toEqual([480_000_000, 500_000_000, 450_000_000])
  })

  it('suy ra giá cũ từ mốc liền trước theo thời gian, không theo thứ tự mảng', () => {
    // Mảng cố tình xáo trộn: sau khi sắp theo thời gian mới biết mốc trước là 450tr.
    const result = buildPriceHistoryEntries([
      entry({ price: 480_000_000, changedAt: '2026-11-10T08:00:00' }),
      entry({ price: 450_000_000, changedAt: '2026-09-01T08:00:00' }),
    ])
    const newest = result[0]
    expect(newest.newPrice).toBe(480_000_000)
    expect(newest.oldPrice).toBe(450_000_000)
    expect(newest.delta).toBe(30_000_000)
    expect(newest.trend).toBe('up')
  })

  it('mốc đầu tiên không có giá cũ và mang nhãn giá nhập kho', () => {
    const [only] = buildPriceHistoryEntries([entry({ price: 500_000_000, reason: null })])
    expect(only.isInitial).toBe(true)
    expect(only.oldPrice).toBeNull()
    expect(only.oldPriceText).toBeNull()
    expect(only.trend).toBe('initial')
    expect(only.reason).toBe('Giá nhập kho ban đầu')
  })

  it('đánh dấu giảm giá đúng hướng và tính %', () => {
    const result = buildPriceHistoryEntries([
      entry({ price: 500_000_000, changedAt: '2026-10-01T08:00:00' }),
      entry({ price: 450_000_000, changedAt: '2026-10-20T08:00:00' }),
    ])
    const newest = result[0]
    expect(newest.trend).toBe('down')
    expect(newest.delta).toBe(-50_000_000)
    expect(newest.deltaText).toBe('−50.000.000 đ')
    expect(newest.deltaPct).toBeCloseTo(-10, 5)
  })

  it('đánh dấu tăng giá với dấu cộng', () => {
    const result = buildPriceHistoryEntries([
      entry({ price: 400_000_000, changedAt: '2026-10-01T08:00:00' }),
      entry({ price: 420_000_000, changedAt: '2026-10-20T08:00:00' }),
    ])
    expect(result[0].trend).toBe('up')
    expect(result[0].deltaText).toBe('+20.000.000 đ')
  })

  it('giữ nguyên giá thì trend là same và delta 0', () => {
    const result = buildPriceHistoryEntries([
      entry({ price: 500_000_000, changedAt: '2026-10-01T08:00:00' }),
      entry({ price: 500_000_000, changedAt: '2026-10-20T08:00:00' }),
    ])
    expect(result[0].trend).toBe('same')
    expect(result[0].delta).toBe(0)
  })

  it('cùng thời điểm thì giữ thứ tự gốc, không đảo lộn lung tung', () => {
    const same = '2026-11-01T08:00:00'
    const result = buildPriceHistoryEntries([
      entry({ price: 100, changedAt: same, reason: 'first' }),
      entry({ price: 200, changedAt: same, reason: 'second' }),
    ])
    // Mới nhất lên đầu: mốc thứ hai (200) đứng trước.
    expect(result.map((e) => e.newPrice)).toEqual([200, 100])
  })

  it('không sinh lỗi khi một mốc thiếu ngày hoặc giá', () => {
    const result = buildPriceHistoryEntries([
      entry({ price: 500_000_000, changedAt: null }),
      entry({ price: null, changedAt: '2026-11-01T08:00:00' }),
    ])
    expect(result).toHaveLength(2)
    expect(result.every((e) => typeof e.newPriceText === 'string')).toBe(true)
    expect(result.find((e) => e.newPrice === null).newPriceText).toBe('—')
  })

  it('mỗi mốc có key riêng để React không cảnh báo trùng', () => {
    const result = buildPriceHistoryEntries([entry({ _id: 'a' }), entry({ _id: 'b' })])
    expect(new Set(result.map((e) => e.key)).size).toBe(2)
  })
})
