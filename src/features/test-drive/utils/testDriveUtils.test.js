import { describe, expect, it } from 'vitest'
import { canCustomerCancel, getStaffActions, groupBySlot } from './testDriveActions'
import { getNearestSlots, getTestDriveErrorMessage, isStaleAppointmentError } from './testDriveErrors'
import { buildSlotPreview, validateTestDriveSettings } from './testDriveSlotPreview'
import { addLocalDays, formatDayLabel, formatTimeRange, getLocalDate, isLocalDate } from './testDriveTime'

const appointment = (status, scheduledAt = '2026-11-09T13:00:00+07:00') => ({ status, scheduledAt, durationMinutes: 60 })
const keys = (item, options) => getStaffActions(item, options).map((action) => action.key)
const defaults = {
  openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', slotDurationMinutes: 60, maxGuestsPerSlot: 3,
}
const apiError = (status, data) => ({ response: { status, data } })

describe('getStaffActions', () => {
  const beforeStart = new Date('2026-11-09T12:30:00+07:00')
  const duringSlot = new Date('2026-11-09T13:20:00+07:00')
  const afterEnd = new Date('2026-11-09T14:00:00+07:00')

  it('cho xác nhận lịch chờ tới hết khung, quá giờ thì không', () => {
    expect(keys(appointment('PENDING'), { now: duringSlot })).toContain('confirm')
    expect(keys(appointment('PENDING'), { now: afterEnd })).not.toContain('confirm')
  })

  it('chỉ ghi kết quả khi lịch đã xác nhận và đã tới giờ', () => {
    expect(keys(appointment('CONFIRMED'), { now: beforeStart })).not.toContain('complete')
    expect(keys(appointment('CONFIRMED'), { now: duringSlot })).toEqual(expect.arrayContaining(['complete', 'noShow']))
    expect(keys(appointment('PENDING'), { now: duringSlot })).not.toContain('complete')
  })

  it('chỉ ADMIN sửa được lịch không đến', () => {
    expect(keys(appointment('NO_SHOW'), { isAdmin: true })).toEqual(['correct'])
    expect(keys(appointment('NO_SHOW'), { isAdmin: false })).toEqual([])
  })

  it('chỉ hiện đổi nhân viên khi có danh sách nhân viên', () => {
    expect(keys(appointment('CONFIRMED'), { now: beforeStart, canReassign: true })).toContain('reassign')
    expect(keys(appointment('CONFIRMED'), { now: beforeStart, canReassign: false })).not.toContain('reassign')
  })

  it('lịch đã kết thúc không còn thao tác', () => {
    expect(keys(appointment('COMPLETED'), { isAdmin: true })).toEqual([])
    expect(keys(appointment('CANCELLED'), { isAdmin: true })).toEqual([])
  })
})

describe('canCustomerCancel', () => {
  it('chỉ hủy được trước giờ hẹn và khi còn giữ chỗ', () => {
    expect(canCustomerCancel(appointment('PENDING'), new Date('2026-11-09T12:59:00+07:00'))).toBe(true)
    expect(canCustomerCancel(appointment('CONFIRMED'), new Date('2026-11-09T13:00:00+07:00'))).toBe(false)
    expect(canCustomerCancel(appointment('COMPLETED'), new Date('2026-11-09T12:00:00+07:00'))).toBe(false)
  })
})

describe('groupBySlot', () => {
  it('gom các lịch cùng giờ bắt đầu thành một nhóm', () => {
    const groups = groupBySlot([appointment('PENDING'), appointment('CONFIRMED'), appointment('PENDING', '2026-11-09T14:00:00+07:00')])
    expect(groups.map((group) => group.items.length)).toEqual([2, 1])
    expect(groups[0].label).toBe('13:00 – 14:00')
  })

  it('thêm ngày vào nhãn khi xem lịch của nhiều ngày', () => {
    expect(groupBySlot([appointment('PENDING')], { withDate: true })[0].label).toBe('Thứ Hai, 09/11/2026 · 13:00 – 14:00')
  })
})

describe('buildSlotPreview', () => {
  it('cấu hình mặc định cho 7 khung và bỏ giờ nghỉ trưa', () => {
    expect(buildSlotPreview(defaults).map((slot) => slot.slice(0, 5))).toEqual(['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'])
  })

  it('khung 45 phút bỏ phần dư và bắt đầu lại lúc hết nghỉ trưa', () => {
    const starts = buildSlotPreview({ ...defaults, slotDurationMinutes: 45 }).map((slot) => slot.slice(0, 5))
    expect(starts).toEqual(['09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00'])
  })
})

describe('validateTestDriveSettings', () => {
  it('chấp nhận cấu hình mặc định', () => {
    expect(validateTestDriveSettings(defaults)).toBeNull()
  })

  it.each([
    [{ closeTime: '09:00' }, 'Giờ kết thúc phải sau giờ bắt đầu.'],
    [{ lunchBreakEnd: '12:00' }, 'Giờ kết thúc nghỉ trưa phải sau giờ bắt đầu nghỉ trưa.'],
    [{ lunchBreakStart: '08:00' }, 'Giờ nghỉ trưa phải nằm trong giờ lái thử.'],
    [{ slotDurationMinutes: 10 }, 'Độ dài khung phải từ 15 đến 480 phút.'],
    [{ maxGuestsPerSlot: 0 }, 'Số khách mỗi khung phải từ 1 đến 100.'],
    [{ lunchBreakEnd: '' }, 'Hãy nhập đủ giờ lái thử và giờ nghỉ trưa.'],
  ])('từ chối %j', (change, message) => {
    expect(validateTestDriveSettings({ ...defaults, ...change })).toBe(message)
  })
})

describe('testDriveTime', () => {
  it('lấy ngày theo giờ Việt Nam dù đang là ngày hôm trước ở UTC', () => {
    expect(getLocalDate('2026-11-08T17:30:00Z')).toBe('2026-11-09')
  })

  it('kiểm tra ngày có thật', () => {
    expect(isLocalDate('2026-11-09')).toBe(true)
    expect(isLocalDate('2026-02-31')).toBe(false)
    expect(isLocalDate(null)).toBe(false)
  })

  it('cộng ngày qua ranh giới tháng', () => {
    expect(addLocalDays('2026-11-30', 1)).toBe('2026-12-01')
  })

  it('định dạng ngày và khoảng giờ', () => {
    expect(formatDayLabel('2026-11-09')).toBe('Thứ Hai, 09/11/2026')
    expect(formatTimeRange({ scheduledAt: '2026-11-09T15:30:00+07:00', durationMinutes: 90 })).toBe('15:30 – 17:00')
  })
})

describe('testDriveErrors', () => {
  it('dịch mã lỗi và trả về khung gợi ý', () => {
    const error = apiError(409, { code: 'SLOT_FULL', errors: { nearestSlots: [{ startAt: 'x' }] } })
    expect(getTestDriveErrorMessage(error)).toContain('hết chỗ')
    expect(getNearestSlots(error)).toHaveLength(1)
  })

  it('kèm thời điểm mở khóa khi bị khóa đặt lịch', () => {
    const error = apiError(403, { code: 'BOOKING_LOCKED', errors: { lockedUntil: '2026-12-09T06:00:00.000Z' } })
    expect(getTestDriveErrorMessage(error)).toContain('mở lại lúc')
  })

  it('dùng chi tiết của lỗi kiểm tra cấu hình', () => {
    const error = apiError(422, { code: 'VALIDATION_ERROR', errors: [{ field: 'testDrive', message: 'Sai giờ' }] })
    expect(getTestDriveErrorMessage(error)).toBe('Sai giờ')
  })

  it('nhận ra lịch đã bị người khác xử lý và lỗi mạng', () => {
    expect(isStaleAppointmentError(apiError(409, { code: 'INVALID_TRANSITION' }))).toBe(true)
    expect(isStaleAppointmentError(apiError(409, { code: 'STAFF_NOT_AVAILABLE' }))).toBe(false)
    expect(getTestDriveErrorMessage(new Error('Network Error'))).toContain('kết nối')
    expect(getTestDriveErrorMessage(apiError(500, { code: 'INTERNAL_ERROR' }))).toContain('Máy chủ')
  })
})
