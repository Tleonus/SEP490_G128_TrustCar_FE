import { describe, it, expect } from 'vitest'
import { rescheduleHint, rescheduledText } from './rescheduleRules'

const NOW = new Date('2026-11-10T03:00:00Z') // 10:00 VN
const at = (hours) => new Date(NOW.getTime() + hours * 3600 * 1000).toISOString()
const visit = (extra) => ({ status: 'CONFIRMED', scheduledAt: at(30), canReschedule: true, rescheduleCount: 0, ...extra })

describe('rescheduleHint (AC-F18)', () => {
  it('BE cho đổi → nút bật, không câu', () => {
    expect(rescheduleHint(visit(), NOW)).toEqual({ canReschedule: true, message: null })
  })

  it('đã đổi 2 lần → không nút, câu "tối đa 2 lần"', () => {
    const result = rescheduleHint(visit({ canReschedule: false, rescheduleCount: 2 }), NOW)
    expect(result.canReschedule).toBe(false)
    expect(result.message).toMatch(/tối đa 2 lần/)
  })

  it('đã đổi 2 lần và còn dưới 12 giờ → vẫn ưu tiên câu "tối đa 2 lần"', () => {
    expect(rescheduleHint(visit({ canReschedule: false, rescheduleCount: 2, scheduledAt: at(5) }), NOW).message).toMatch(/tối đa/)
  })

  it('còn dưới 12 giờ → câu "dưới 12 giờ"', () => {
    const result = rescheduleHint(visit({ canReschedule: false, scheduledAt: at(11.5) }), NOW)
    expect(result.message).toMatch(/dưới 12 giờ/)
  })

  it('đúng 12 giờ mà BE vẫn không cho → câu chung, không khẳng định "dưới 12 giờ"', () => {
    const result = rescheduleHint(visit({ canReschedule: false, scheduledAt: at(12) }), NOW)
    expect(result.canReschedule).toBe(false)
    expect(result.message).not.toMatch(/dưới 12 giờ/)
    expect(result.message).toMatch(/gọi showroom/)
  })

  it('PENDING cũng được xét như CONFIRMED', () => {
    expect(rescheduleHint(visit({ status: 'PENDING' }), NOW).canReschedule).toBe(true)
  })

  it.each(['CANCELLED', 'COMPLETED', 'NO_SHOW'])('lượt %s → không nút, không câu', (status) => {
    expect(rescheduleHint(visit({ status, canReschedule: false }), NOW)).toEqual({ canReschedule: false, message: null })
  })

  it('đã tới giờ hẹn → không nút, không câu (kể cả khi BE nói true)', () => {
    expect(rescheduleHint(visit({ scheduledAt: at(-1) }), NOW)).toEqual({ canReschedule: false, message: null })
  })

  it('canReschedule chỉ nhận đúng `true` (chuỗi/thiếu không làm bật nút)', () => {
    expect(rescheduleHint(visit({ canReschedule: 'true' }), NOW).canReschedule).toBe(false)
    expect(rescheduleHint(visit({ canReschedule: undefined }), NOW).canReschedule).toBe(false)
  })

  it('dữ liệu rỗng không làm vỡ', () => {
    expect(rescheduleHint(undefined, NOW)).toEqual({ canReschedule: false, message: null })
    expect(rescheduleHint({}, NOW)).toEqual({ canReschedule: false, message: null })
  })
})

describe('rescheduledText', () => {
  it('chỉ hiện khi n > 0', () => {
    expect(rescheduledText({ rescheduleCount: 0 })).toBeNull()
    expect(rescheduledText({})).toBeNull()
    expect(rescheduledText(undefined)).toBeNull()
    expect(rescheduledText({ rescheduleCount: 1 })).toBe('Đã đổi lịch 1 lần')
    expect(rescheduledText({ rescheduleCount: 2 })).toBe('Đã đổi lịch 2 lần')
  })
})
