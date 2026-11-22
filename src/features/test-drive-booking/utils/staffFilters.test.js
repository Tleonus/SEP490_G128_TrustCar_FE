import { describe, it, expect } from 'vitest'
import { buildStaffParams, describeView, isRangeReversed, DEFAULT_STAFF_FILTERS } from './staffFilters'

describe('buildStaffParams (AC-F09)', () => {
  it('mặc định: chỉ phân trang, không lọc (BE tự lấy từ hôm nay)', () => {
    expect(buildStaffParams(DEFAULT_STAFF_FILTERS)).toEqual({ page: 1, limit: 20 })
    expect(buildStaffParams({}, 3)).toEqual({ page: 3, limit: 20 })
  })

  it('nút nhanh "Chờ xác nhận" → status=PENDING', () => {
    expect(buildStaffParams({ quick: 'PENDING' })).toMatchObject({ status: 'PENDING' })
  })

  it('nút nhanh "Xe không còn bán" → cancellationType=CAR_UNAVAILABLE', () => {
    const params = buildStaffParams({ quick: 'CAR_UNAVAILABLE' })
    expect(params.cancellationType).toBe('CAR_UNAVAILABLE')
    expect(params.status).toBeUndefined()
  })

  it('nút nhanh "Gọi nhắc" → needsReminderCall=true, không có status (AC-F22)', () => {
    const params = buildStaffParams({ quick: 'REMINDER', status: 'CANCELLED' })
    expect(params).toEqual({ page: 1, limit: 20, needsReminderCall: true })
  })

  it('nút nhanh "Cần chốt kết quả" → needsOutcome=true, không có status (AC-F22)', () => {
    const params = buildStaffParams({ quick: 'OUTCOME', status: 'CONFIRMED' })
    expect(params).toEqual({ page: 1, limit: 20, needsOutcome: true })
  })

  it('không bao giờ gửi cờ nhắc việc = false', () => {
    for (const quick of ['ALL', 'PENDING', 'CAR_UNAVAILABLE', 'REMINDER', 'OUTCOME']) {
      const params = buildStaffParams({ quick })
      expect(Object.values(params)).not.toContain(false)
    }
    expect(buildStaffParams({ quick: 'PENDING' })).not.toHaveProperty('needsReminderCall')
    expect(buildStaffParams({ quick: 'REMINDER' })).not.toHaveProperty('needsOutcome')
  })

  it('nút nhanh nhắc việc vẫn nhận khoảng ngày', () => {
    expect(buildStaffParams({ quick: 'REMINDER', from: '2026-11-10', to: '2026-11-12' }, 2)).toMatchObject({
      needsReminderCall: true, from: '2026-11-10', to: '2026-11-12', page: 2,
    })
  })

  it('nút nhanh thắng ô trạng thái; không có nút nhanh thì dùng ô trạng thái', () => {
    expect(buildStaffParams({ quick: 'PENDING', status: 'CANCELLED' }).status).toBe('PENDING')
    expect(buildStaffParams({ quick: 'ALL', status: 'CONFIRMED' }).status).toBe('CONFIRMED')
    expect(buildStaffParams({ quick: 'ALL', status: 'ALL' }).status).toBeUndefined()
  })

  it('khoảng ngày được chuyển nguyên dạng YYYY-MM-DD; bỏ giá trị rỗng', () => {
    expect(buildStaffParams({ from: '2026-11-10', to: '2026-11-12' })).toMatchObject({ from: '2026-11-10', to: '2026-11-12' })
    const only = buildStaffParams({ from: '', to: '2026-11-12' })
    expect(only.from).toBeUndefined()
    expect(only.to).toBe('2026-11-12')
  })

  it('khoảng ngày ngược thứ tự thì bỏ `to` để BE không trả 422', () => {
    const params = buildStaffParams({ from: '2026-11-12', to: '2026-11-10' })
    expect(params.from).toBe('2026-11-12')
    expect(params.to).toBeUndefined()
    expect(isRangeReversed({ from: '2026-11-12', to: '2026-11-10' })).toBe(true)
    expect(isRangeReversed({ from: '2026-11-10', to: '2026-11-10' })).toBe(false)
    expect(isRangeReversed({ from: '', to: '2026-11-10' })).toBe(false)
  })
})

describe('sort và describeView (AC-F32, AC-F34)', () => {
  it('sort mặc định (asc) không được gửi; desc gửi sort=desc', () => {
    expect(buildStaffParams({})).not.toHaveProperty('sort')
    expect(buildStaffParams({ sort: 'asc' })).not.toHaveProperty('sort')
    expect(buildStaffParams({ sort: 'desc' })).toMatchObject({ sort: 'desc' })
  })

  it('sort kết hợp được với nút nhanh và khoảng ngày', () => {
    expect(buildStaffParams({ quick: 'PENDING', sort: 'desc', from: '2026-11-09' }, 2)).toEqual({
      page: 2, limit: 20, status: 'PENDING', sort: 'desc', from: '2026-11-09',
    })
  })

  it('mặc định có sort asc trong bộ lọc', () => {
    expect(DEFAULT_STAFF_FILTERS.sort).toBe('asc')
  })

  it('describeView: Từ ngày trống → "từ hôm nay trở đi · gần nhất trước"', () => {
    expect(describeView(DEFAULT_STAFF_FILTERS)).toBe('Đang xem từ hôm nay trở đi · gần nhất trước. Lượt cần xử lý luôn ở đầu.')
  })

  it('describeView: có Từ ngày, Đến ngày và thứ tự mới nhất trước', () => {
    expect(describeView({ from: '2026-11-09' })).toContain('từ 09/11/2026 trở đi · gần nhất trước')
    expect(describeView({ from: '2026-11-09', to: '2026-11-12', sort: 'desc' })).toContain('từ 09/11/2026 đến 12/11/2026 · mới nhất trước')
    expect(describeView({ to: '2026-11-12' })).toContain('từ hôm nay đến 12/11/2026')
  })

  it('describeView: khoảng ngày ngược thứ tự bỏ "Đến ngày" giống cách gửi lên BE', () => {
    expect(describeView({ from: '2026-11-12', to: '2026-11-09' })).toContain('từ 12/11/2026 trở đi')
  })
})
