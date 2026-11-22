import { describe, expect, it } from 'vitest'
import {
  buildBrandBreakdown,
  buildMonthlyRevenue,
  computeKpis,
  formatVndCompact,
  formatVndFull,
  monthKey,
  recentLeads,
  recentSoldCars,
  soldDateOf,
} from './dashboardMetrics'

// Mốc thời gian cố định để test không phụ thuộc ngày chạy.
const NOW = new Date(2026, 10, 15) // 15/11/2026

const car = (overrides) => ({
  _id: Math.random().toString(36).slice(2),
  status: 'AVAILABLE',
  price: 500_000_000,
  make: 'KIA',
  ...overrides,
})

describe('monthKey', () => {
  it('trả YYYY-MM có đệm 0', () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe('2026-01')
    expect(monthKey(new Date(2026, 11, 31))).toBe('2026-12')
  })

  it('trả null với ngày không hợp lệ', () => {
    expect(monthKey('không phải ngày')).toBeNull()
    expect(monthKey(null)).toBeNull()
  })
})

describe('soldDateOf', () => {
  it('ưu tiên soldAt', () => {
    const d = soldDateOf({ soldAt: '2026-11-01', statusChangedAt: '2026-01-01' })
    expect(d.getMonth()).toBe(10)
  })

  it('lùi về statusChangedAt khi thiếu soldAt', () => {
    const d = soldDateOf({ statusChangedAt: '2026-03-02' })
    expect(d.getMonth()).toBe(2)
  })

  it('trả null khi không có ngày nào', () => {
    expect(soldDateOf({ status: 'SOLD' })).toBeNull()
    expect(soldDateOf(null)).toBeNull()
  })
})

describe('buildMonthlyRevenue', () => {
  it('trả đủ số tháng, cũ đến mới, kể cả tháng trống', () => {
    const buckets = buildMonthlyRevenue([], { months: 6, now: NOW })
    expect(buckets).toHaveLength(6)
    expect(buckets[5].label).toBe('T11')
    expect(buckets[0].label).toBe('T6')
    expect(buckets.every((b) => b.revenue === 0 && b.soldCount === 0)).toBe(true)
  })

  it('cộng doanh thu và số xe bán vào đúng tháng', () => {
    const cars = [
      car({ status: 'SOLD', price: 600_000_000, soldAt: new Date(2026, 10, 3) }),
      car({ status: 'SOLD', price: 400_000_000, soldAt: new Date(2026, 10, 9) }),
      car({ status: 'SOLD', price: 300_000_000, soldAt: new Date(2026, 8, 20) }),
      car({ status: 'AVAILABLE', price: 900_000_000 }),
    ]
    const buckets = buildMonthlyRevenue(cars, { months: 6, now: NOW })
    const nov = buckets.find((b) => b.label === 'T11')
    const sep = buckets.find((b) => b.label === 'T9')
    expect(nov).toMatchObject({ revenue: 1_000_000_000, soldCount: 2 })
    expect(sep).toMatchObject({ revenue: 300_000_000, soldCount: 1 })
  })

  it('bỏ qua xe bán ngoài khoảng tháng đang hiển thị', () => {
    const cars = [car({ status: 'SOLD', price: 100, soldAt: new Date(2025, 0, 1) })]
    const buckets = buildMonthlyRevenue(cars, { months: 6, now: NOW })
    expect(buckets.reduce((sum, b) => sum + b.revenue, 0)).toBe(0)
  })

  it('bỏ qua giá không hợp lệ thay vì sinh NaN', () => {
    const cars = [car({ status: 'SOLD', price: 'không phải số', soldAt: new Date(2026, 10, 3) })]
    const [bucket] = buildMonthlyRevenue(cars, { months: 1, now: NOW })
    expect(bucket.revenue).toBe(0)
    expect(bucket.soldCount).toBe(1)
  })
})

describe('computeKpis', () => {
  const cars = [
    car({ status: 'AVAILABLE' }),
    car({ status: 'AVAILABLE' }),
    car({ status: 'RESERVED' }),
    car({ status: 'UNDER_INSPECTION' }),
    car({ status: 'UNDER_INSPECTION' }),
    car({ status: 'APPROVED_CPO' }),
    car({ status: 'SOLD', price: 1_000_000_000, soldAt: new Date(2026, 10, 2) }),
    car({ status: 'SOLD', price: 500_000_000, soldAt: new Date(2026, 9, 2) }),
    car({ status: 'SOLD', price: 700_000_000, soldAt: new Date(2026, 9, 20) }),
  ]

  it('tính đúng KPI chính', () => {
    const kpis = computeKpis(cars, { now: NOW })
    expect(kpis.revenueThisMonth).toBe(1_000_000_000)
    expect(kpis.soldThisMonth).toBe(1)
    expect(kpis.availableInventory).toBe(2)
    expect(kpis.inspectionQueue).toBe(2)
    expect(kpis.saleQueue).toBe(1)
    expect(kpis.pendingApprovals).toBe(3)
    expect(kpis.totalCars).toBe(9)
  })

  it('tính tăng trưởng doanh thu so với tháng trước', () => {
    const kpis = computeKpis(cars, { now: NOW })
    // tháng trước 1,2 tỷ → tháng này 1 tỷ = giảm 16,67%
    expect(kpis.revenuePrevMonth).toBe(1_200_000_000)
    expect(kpis.revenueDeltaPct).toBeCloseTo(-16.6667, 3)
  })

  it('trả delta doanh thu null khi tháng trước chưa bán được xe', () => {
    const onlyThisMonth = [car({ status: 'SOLD', price: 100, soldAt: new Date(2026, 10, 1) })]
    expect(computeKpis(onlyThisMonth, { now: NOW }).revenueDeltaPct).toBeNull()
  })

  it('đếm riêng xe SOLD thiếu ngày bán', () => {
    const kpis = computeKpis([...cars, car({ status: 'SOLD', price: 100 })], { now: NOW })
    expect(kpis.soldMissingDate).toBe(1)
  })

  it('chịu được đầu vào rỗng hoặc không phải mảng', () => {
    expect(computeKpis([], { now: NOW })).toMatchObject({
      revenueThisMonth: 0, soldThisMonth: 0, availableInventory: 0, pendingApprovals: 0,
    })
    expect(computeKpis(null, { now: NOW }).totalCars).toBe(0)
  })
})

describe('buildBrandBreakdown', () => {
  it('gộp hãng theo tên, không phân biệt hoa thường', () => {
    const cars = [car({ make: 'kia' }), car({ make: 'KIA' }), car({ make: 'Mazda' })]
    expect(buildBrandBreakdown(cars)).toEqual([
      { name: 'KIA', value: 2 },
      { name: 'MAZDA', value: 1 },
    ])
  })

  it('gộp phần dư thành "Hãng khác" khi vượt giới hạn', () => {
    const cars = ['A', 'A', 'A', 'B', 'B', 'C', 'D', 'E'].map((make) => car({ make }))
    const result = buildBrandBreakdown(cars, { limit: 2 })
    expect(result[0]).toEqual({ name: 'A', value: 3 })
    expect(result).toHaveLength(3)
    expect(result.at(-1)).toEqual({ name: 'Hãng khác', value: 3 })
  })

  it('bỏ qua xe không có hãng', () => {
    expect(buildBrandBreakdown([car({ make: '' }), car({ make: null })])).toEqual([])
  })
})

describe('recentSoldCars / recentLeads', () => {
  it('xe bán gần nhất lên đầu và loại xe thiếu ngày bán', () => {
    const cars = [
      car({ _id: 'old', status: 'SOLD', soldAt: new Date(2026, 0, 1) }),
      car({ _id: 'new', status: 'SOLD', soldAt: new Date(2026, 10, 1) }),
      car({ _id: 'undated', status: 'SOLD' }),
      car({ _id: 'available', status: 'AVAILABLE' }),
    ]
    expect(recentSoldCars(cars).map((c) => c._id)).toEqual(['new', 'old'])
  })

  it('lead mới nhất lên đầu và tôn trọng giới hạn', () => {
    const leads = [
      { id: 'a', createdAt: '2026-11-01T00:00:00Z' },
      { id: 'b', createdAt: '2026-11-10T00:00:00Z' },
      { id: 'c', createdAt: '2026-10-01T00:00:00Z' },
    ]
    expect(recentLeads(leads, 2).map((l) => l.id)).toEqual(['b', 'a'])
  })
})

describe('định dạng tiền', () => {
  it('rút gọn theo tỷ / triệu', () => {
    expect(formatVndCompact(12_500_000_000)).toBe('12,5 tỷ')
    expect(formatVndCompact(1_000_000_000)).toBe('1 tỷ')
    expect(formatVndCompact(850_000_000)).toBe('850 triệu')
    expect(formatVndCompact(500_000)).toBe('500.000')
    expect(formatVndCompact(0)).toBe('0')
    expect(formatVndCompact(-5)).toBe('0')
  })

  it('định dạng đầy đủ có dấu phân cách', () => {
    expect(formatVndFull(1_234_567)).toBe('1.234.567 ₫')
    expect(formatVndFull(undefined)).toBe('0 ₫')
  })
})
