import { describe, expect, it } from 'vitest'
import { buildAuditParams, EMPTY_FILTERS, hasActiveFilters, validateRange } from './buildAuditParams'

describe('buildAuditParams', () => {
  it('không lọc gì → chỉ page và limit', () => {
    expect(buildAuditParams(EMPTY_FILTERS, 1)).toEqual({ page: 1, limit: 20 })
    expect(buildAuditParams()).toEqual({ page: 1, limit: 20 })
  })

  it('chỉ gửi ô có giá trị', () => {
    expect(buildAuditParams({ ...EMPTY_FILTERS, eventType: 'USER_LOGIN' }, 1)).toEqual({ page: 1, limit: 20, eventType: 'USER_LOGIN' })
  })

  it('đủ mọi ô', () => {
    expect(buildAuditParams({ eventType: 'CAR_PRICE_UPDATED', targetModel: 'Car', actorEmail: 'admin@trustcar.vn', from: '2026-11-01', to: '2026-11-30' }, 3)).toEqual({
      page: 3, limit: 20, eventType: 'CAR_PRICE_UPDATED', targetModel: 'Car', actorEmail: 'admin@trustcar.vn', from: '2026-11-01', to: '2026-11-30',
    })
  })

  it('KAN-92: gửi action khi đã chọn hành động', () => {
    expect(buildAuditParams({ ...EMPTY_FILTERS, action: 'DELETE' }, 1)).toEqual({ page: 1, limit: 20, action: 'DELETE' })
    expect(hasActiveFilters({ ...EMPTY_FILTERS, action: 'AUTH' })).toBe(true)
  })

  it('cắt khoảng trắng; ô chỉ có khoảng trắng coi như trống', () => {
    expect(buildAuditParams({ ...EMPTY_FILTERS, actorEmail: '  a@b.vn  ', targetModel: '   ' }, 1)).toEqual({ page: 1, limit: 20, actorEmail: 'a@b.vn' })
  })

  it('trang không hợp lệ về 1; số thực làm tròn xuống', () => {
    expect(buildAuditParams({}, 0).page).toBe(1)
    expect(buildAuditParams({}, -4).page).toBe(1)
    expect(buildAuditParams({}, 'abc').page).toBe(1)
    expect(buildAuditParams({}, undefined).page).toBe(1)
    expect(buildAuditParams({}, 2.9).page).toBe(2)
    expect(buildAuditParams({}, '3').page).toBe(3)
  })

  it('giá trị không phải chuỗi bị bỏ qua (không văng lỗi)', () => {
    expect(buildAuditParams({ eventType: null, actorEmail: 123, from: undefined }, 1)).toEqual({ page: 1, limit: 20 })
  })

  it('không đổi bộ lọc gốc', () => {
    const filters = { ...EMPTY_FILTERS, actorEmail: ' x@y.vn ' }
    buildAuditParams(filters, 1)
    expect(filters.actorEmail).toBe(' x@y.vn ')
  })
})

describe('validateRange', () => {
  it('từ ngày sau đến ngày → có lỗi', () => {
    expect(validateRange('2026-11-20', '2026-11-10')).toMatch(/trước hoặc bằng/)
  })

  it('cùng một ngày, đúng thứ tự, hoặc thiếu một đầu → hợp lệ', () => {
    expect(validateRange('2026-11-15', '2026-11-15')).toBeNull()
    expect(validateRange('2026-11-10', '2026-11-20')).toBeNull()
    expect(validateRange('2026-11-10', '')).toBeNull()
    expect(validateRange('', '2026-11-10')).toBeNull()
    expect(validateRange('', '')).toBeNull()
    expect(validateRange(undefined, undefined)).toBeNull()
  })

  it('so sánh đúng qua ranh giới tháng và năm', () => {
    expect(validateRange('2026-12-31', '2027-01-01')).toBeNull()
    expect(validateRange('2027-01-01', '2026-12-31')).not.toBeNull()
  })
})

describe('hasActiveFilters', () => {
  it('false khi mọi ô trống, true khi có ô có giá trị', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, actorEmail: '  ' })).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, from: '2026-11-01' })).toBe(true)
    expect(hasActiveFilters(undefined)).toBe(false)
  })
})
