import { describe, expect, it } from 'vitest'
import { buildPriceSchedule, daysInStockOf, priceAtStep } from './buildPriceSchedule'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-11-18T00:00:00Z').getTime()

/** Xe có ngày nhập kho cách `now` đúng `days` ngày. */
function carListedDaysAgo(days, price = 600_000_000) {
  return { price, listedDate: new Date(NOW - days * DAY_MS).toISOString() }
}

describe('priceAtStep', () => {
  it('bậc 0 là giá gốc, mỗi bậc giảm 5% của giá gốc', () => {
    expect(priceAtStep(600_000_000, 0)).toBe(600_000_000)
    expect(priceAtStep(600_000_000, 1)).toBe(570_000_000)
    expect(priceAtStep(600_000_000, 2)).toBe(540_000_000)
    expect(priceAtStep(600_000_000, 4)).toBe(480_000_000)
  })

  it('trả null với giá không hợp lệ', () => {
    expect(priceAtStep(null, 0)).toBeNull()
    expect(priceAtStep(0, 0)).toBeNull()
    expect(priceAtStep(-5, 1)).toBeNull()
    expect(priceAtStep(600_000_000, -1)).toBeNull()
  })
})

describe('daysInStockOf', () => {
  it('làm tròn xuống theo ngày', () => {
    expect(daysInStockOf(new Date(NOW - 59.9 * DAY_MS).toISOString(), NOW)).toBe(59)
  })

  it('không trả số âm khi listedDate ở tương lai', () => {
    expect(daysInStockOf(new Date(NOW + 10 * DAY_MS).toISOString(), NOW)).toBe(0)
  })

  it('trả null khi thiếu hoặc sai ngày', () => {
    expect(daysInStockOf(null, NOW)).toBeNull()
    expect(daysInStockOf('không-phải-ngày', NOW)).toBeNull()
  })
})

describe('buildPriceSchedule', () => {
  it('xe vừa nhập: chỉ có giá gốc đã áp dụng và một mốc sắp giảm', () => {
    const result = buildPriceSchedule(carListedDaysAgo(10), NOW)

    expect(result.basePrice).toBe(600_000_000)
    expect(result.appliedCount).toBe(0)
    expect(result.entries).toHaveLength(2)
    // Mới nhất lên đầu
    expect(result.entries[0]).toMatchObject({ step: 1, price: 570_000_000, applied: false })
    expect(result.entries[1]).toMatchObject({ step: 0, price: 600_000_000, applied: true })
    expect(result.daysToNextDrop).toBe(50)
  })

  it('đúng mốc 60 ngày thì đợt giảm đầu tiên đã áp dụng', () => {
    const result = buildPriceSchedule(carListedDaysAgo(60), NOW)

    expect(result.appliedCount).toBe(1)
    const applied = result.entries.filter((entry) => entry.applied)
    expect(applied.map((entry) => entry.step)).toEqual([1, 0])
    expect(applied[0].price).toBe(570_000_000)
    expect(result.nextStep).toMatchObject({ step: 2, price: 540_000_000 })
    expect(result.daysToNextDrop).toBe(60)
  })

  it('tồn 93 ngày: một đợt đã giảm, đợt kế tiếp còn 27 ngày', () => {
    const result = buildPriceSchedule(carListedDaysAgo(93), NOW)

    expect(result.appliedCount).toBe(1)
    expect(result.daysToNextDrop).toBe(27)
    expect(result.entries.find((entry) => entry.step === 1).price).toBe(570_000_000)
  })

  it('tính đúng tổng mức giảm và phần trăm so với giá gốc', () => {
    const result = buildPriceSchedule(carListedDaysAgo(130), NOW)
    const step2 = result.entries.find((entry) => entry.step === 2)

    expect(result.appliedCount).toBe(2)
    expect(step2).toMatchObject({ price: 540_000_000, totalDrop: 60_000_000, totalPct: 10 })
  })

  it('giá không giảm xuống 0 dù tồn rất lâu', () => {
    const result = buildPriceSchedule(carListedDaysAgo(4000), NOW)

    expect(result.entries.length).toBeGreaterThan(0)
    expect(result.entries.every((entry) => entry.price > 0)).toBe(true)
    expect(Math.min(...result.entries.map((entry) => entry.price))).toBeGreaterThan(0)
  })

  it('thiếu ngày nhập kho: chỉ hiện giá gốc, không bịa ngày', () => {
    const result = buildPriceSchedule({ price: 500_000_000, listedDate: null }, NOW)

    expect(result.missingListedDate).toBe(true)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]).toMatchObject({ step: 0, price: 500_000_000, applied: true, effectiveDate: null })
    expect(result.daysToNextDrop).toBeNull()
  })

  it('thiếu giá: trả về lịch rỗng thay vì NaN', () => {
    const result = buildPriceSchedule({ price: null, listedDate: carListedDaysAgo(10).listedDate }, NOW)

    expect(result.basePrice).toBeNull()
    expect(result.entries).toEqual([])
    expect(result.nextStep).toBeNull()
  })
})
