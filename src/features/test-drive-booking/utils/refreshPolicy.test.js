import { describe, it, expect } from 'vitest'
import { autoRefreshDelay, shouldRefreshOnFocus } from './refreshPolicy'

describe('shouldRefreshOnFocus (AC-F22)', () => {
  const NOW = 1_000_000

  it('dưới 30 giây → không tải', () => {
    expect(shouldRefreshOnFocus(NOW - 29_999, NOW)).toBe(false)
    expect(shouldRefreshOnFocus(NOW, NOW)).toBe(false)
  })

  it('đúng 30 giây và hơn → tải', () => {
    expect(shouldRefreshOnFocus(NOW - 30_000, NOW)).toBe(true)
    expect(shouldRefreshOnFocus(NOW - 120_000, NOW)).toBe(true)
  })

  it('chưa từng tải hoặc giá trị lạ → không tự tải', () => {
    expect(shouldRefreshOnFocus(null, NOW)).toBe(false)
    expect(shouldRefreshOnFocus(undefined, NOW)).toBe(false)
    expect(shouldRefreshOnFocus(Number.NaN, NOW)).toBe(false)
    expect(shouldRefreshOnFocus('1', NOW)).toBe(false)
  })
})

describe('autoRefreshDelay (AC-F35)', () => {
  const NOW = 5_000_000

  it('60 giây sau lần tải gần nhất xong', () => {
    expect(autoRefreshDelay(NOW, null, NOW)).toBe(60_000)
    expect(autoRefreshDelay(NOW - 20_000, null, NOW)).toBe(40_000)
  })

  it('đã quá hạn → 0 (tải ngay), không âm', () => {
    expect(autoRefreshDelay(NOW - 61_000, null, NOW)).toBe(0)
    expect(autoRefreshDelay(NOW - 10 * 60_000, null, NOW)).toBe(0)
  })

  it('lần ngầm trước bị 429 → chờ 5 phút; lỗi khác vẫn 60 giây', () => {
    expect(autoRefreshDelay(NOW, 429, NOW)).toBe(300_000)
    expect(autoRefreshDelay(NOW, 500, NOW)).toBe(60_000)
    expect(autoRefreshDelay(NOW, 0, NOW)).toBe(60_000)
  })

  it('chưa từng tải hoặc giá trị lạ → không lên lịch', () => {
    expect(autoRefreshDelay(null, null, NOW)).toBeNull()
    expect(autoRefreshDelay(undefined, null, NOW)).toBeNull()
    expect(autoRefreshDelay(Number.NaN, null, NOW)).toBeNull()
    expect(autoRefreshDelay('1', null, NOW)).toBeNull()
  })
})
