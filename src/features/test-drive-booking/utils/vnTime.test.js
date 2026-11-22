import process from 'node:process'
import { describe, it, expect, afterEach } from 'vitest'
import {
  formatVnDate, formatVnTime, formatVnDateTime, vnDayKey, addDays, weekdayLabel, shortDate, hoursUntil, sameInstant,
} from './vnTime'

const SLOT = '2026-11-10T03:00:00.000Z' // 10:00 giờ VN

describe('sameInstant (so khung hiện tại khi đổi lịch)', () => {
  it('cùng thời điểm dù khác offset → true', () => {
    expect(sameInstant('2026-11-12T10:00:00+07:00', '2026-11-12T03:00:00.000Z')).toBe(true)
  })
  it('khác thời điểm → false; thiếu một bên → false', () => {
    expect(sameInstant('2026-11-12T10:00:00+07:00', '2026-11-12T04:00:00Z')).toBe(false)
    expect(sameInstant(undefined, '2026-11-12T03:00:00Z')).toBe(false)
    expect(sameInstant(null, null)).toBe(false)
  })
})

describe('vnTime', () => {
  const original = process.env.TZ
  afterEach(() => {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  })

  it('hiển thị đúng giờ VN bất kể múi giờ của máy (AC-F12)', () => {
    for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati']) {
      process.env.TZ = zone
      expect(formatVnTime(SLOT)).toBe('10:00')
      expect(formatVnDate(SLOT)).toBe('10/11/2026')
      expect(formatVnDateTime(SLOT)).toBe('10:00 10/11/2026')
      expect(vnDayKey(SLOT)).toBe('2026-11-10')
    }
  })

  it('đổi sang ngày kế khi qua nửa đêm giờ VN', () => {
    expect(vnDayKey('2026-11-10T16:59:00Z')).toBe('2026-11-10') // 23:59 VN
    expect(vnDayKey('2026-11-10T17:00:00Z')).toBe('2026-11-11') // 00:00 VN
    expect(formatVnTime('2026-11-10T17:00:00Z')).toBe('00:00')
  })

  it('nhận cả chuỗi có offset +07:00 và đối tượng Date', () => {
    expect(formatVnTime('2026-11-10T10:00:00+07:00')).toBe('10:00')
    expect(formatVnTime(new Date(SLOT))).toBe('10:00')
  })

  it('trả chuỗi rỗng với giá trị không hợp lệ', () => {
    expect(formatVnDateTime('không phải ngày')).toBe('')
    expect(vnDayKey(undefined)).toBe('')
  })

  it('cộng ngày qua tháng và năm, nhãn thứ, ngày ngắn', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(weekdayLabel('2026-11-10')).toBe('T3')
    expect(weekdayLabel('2026-11-08')).toBe('CN')
    expect(shortDate('2026-11-10')).toBe('10/11')
  })

  it('hoursUntil: dương trước giờ, âm sau giờ, đúng 12 giờ', () => {
    const now = new Date('2026-11-09T15:00:00Z')
    expect(hoursUntil(SLOT, now)).toBe(12)
    expect(hoursUntil(SLOT, new Date('2026-11-10T04:00:00Z'))).toBe(-1)
  })
})
