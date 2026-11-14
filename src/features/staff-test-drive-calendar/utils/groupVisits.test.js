import { describe, expect, it } from 'vitest'
import { badgesOf, dayLines, groupByDay, slotOf, visitLine, visitsOfDay } from './groupVisits'

// 10:00 giờ VN = 03:00Z. 08:00 VN = 01:00Z, 13:00 VN = 06:00Z, 15:00 VN = 08:00Z.
const visit = (code, scheduledAt, extra = {}) => ({
  visitId: `id-${code}`, visitCode: code, scheduledAt, status: 'CONFIRMED',
  customer: { fullName: `Khách ${code}` }, appointments: [{ _id: `a-${code}`, status: 'CONFIRMED', car: { _id: 'c1', status: 'AVAILABLE' } }],
  ...extra,
})
const AT = { 8: '2026-11-17T01:00:00Z', 10: '2026-11-17T03:00:00Z', 13: '2026-11-17T06:00:00Z', 15: '2026-11-17T08:00:00Z' }

describe('slotOf: khung theo giờ VN', () => {
  it('bốn khung chuẩn', () => {
    expect(slotOf(AT[8])).toBe('08:00')
    expect(slotOf(AT[10])).toBe('10:00')
    expect(slotOf(AT[13])).toBe('13:00')
    expect(slotOf(AT[15])).toBe('15:00')
  })

  it('giờ lạ (dữ liệu cũ) vào "other"; ghi chú +07:00 cho cùng kết quả', () => {
    expect(slotOf('2026-11-17T09:30:00+07:00')).toBe('other')
    expect(slotOf('2026-11-17T10:00:00+07:00')).toBe('10:00')
    expect(slotOf('không phải ngày')).toBe('other')
  })
})

describe('groupByDay: đúng ngày VN, độc lập múi giờ trình duyệt', () => {
  it('23:30 VN ngày 30/11 ở lại ngày 30/11; 00:30 VN ngày 01/12 sang ngày 01/12', () => {
    const days = groupByDay([visit('A', '2026-11-30T16:30:00Z'), visit('B', '2026-11-30T17:30:00Z')])
    expect(days.get('2026-11-30').total).toBe(1)
    expect(days.get('2026-11-30').slots.other[0].visitCode).toBe('A')
    expect(days.get('2026-12-01').total).toBe(1)
    expect(days.has('2026-12-02')).toBe(false)
  })

  it('xếp lượt vào đúng khung, nhiều lượt cùng khung theo mã', () => {
    const days = groupByDay([visit('B', AT[10]), visit('A', AT[10]), visit('C', AT[15])])
    const entry = days.get('2026-11-17')
    expect(entry.total).toBe(3)
    expect(entry.slots['10:00'].map((v) => v.visitCode)).toEqual(['A', 'B'])
    expect(entry.slots['15:00'].map((v) => v.visitCode)).toEqual(['C'])
    expect(entry.slots['08:00']).toEqual([])
  })

  it('giờ 09:30 vẫn hiện, ở khối "other" của ngày (không bị mất)', () => {
    const days = groupByDay([visit('OLD', '2026-11-17T02:30:00Z')])
    expect(days.get('2026-11-17').slots.other.map((v) => v.visitCode)).toEqual(['OLD'])
    expect(days.get('2026-11-17').total).toBe(1)
  })

  it('ẩn lượt hủy mặc định, hiện khi bật và không đếm lượt ẩn vào total', () => {
    const items = [visit('A', AT[10]), visit('X', AT[13], { status: 'CANCELLED' })]
    expect(groupByDay(items).get('2026-11-17').total).toBe(1)
    expect(groupByDay(items, { showCancelled: true }).get('2026-11-17').total).toBe(2)
  })

  it('chỉ có lượt hủy và đang ẩn thì ngày đó không có mục nào', () => {
    expect(groupByDay([visit('X', AT[10], { status: 'CANCELLED' })]).size).toBe(0)
  })

  it('bỏ qua lượt không có giờ hợp lệ, danh sách rỗng hoặc thiếu', () => {
    expect(groupByDay([visit('A', 'xxx'), visit('B', null)]).size).toBe(0)
    expect(groupByDay([]).size).toBe(0)
    expect(groupByDay(undefined).size).toBe(0)
  })
})

describe('visitsOfDay / dayLines', () => {
  const five = groupByDay([visit('A', AT[8]), visit('B', AT[10]), visit('C', AT[13]), visit('D', AT[15]), visit('E', '2026-11-17T02:30:00Z')]).get('2026-11-17')

  it('theo thứ tự khung chuẩn rồi giờ lạ', () => {
    expect(visitsOfDay(five).map((v) => v.visitCode)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('5 lượt, tối đa 3 dòng → 3 dòng và "+2"', () => {
    const { lines, more } = dayLines(five, 3)
    expect(lines.map((v) => v.visitCode)).toEqual(['A', 'B', 'C'])
    expect(more).toBe(2)
  })

  it('ít hơn giới hạn thì không có "+N"; ngày không có lượt trả rỗng', () => {
    expect(dayLines(five, 10)).toEqual({ lines: visitsOfDay(five), more: 0 })
    expect(dayLines(undefined, 3)).toEqual({ lines: [], more: 0 })
  })
})

describe('visitLine', () => {
  it('giờ · tên · số xe', () => {
    expect(visitLine(visit('A', AT[10]))).toBe('10:00 · Khách A · 1 xe')
  })

  it('thiếu tên hoặc xe vẫn không văng lỗi', () => {
    expect(visitLine({ scheduledAt: AT[10], appointments: [] })).toBe('10:00 · (không rõ)')
    expect(visitLine({})).toBe('(không rõ)')
  })
})

describe('badgesOf: nhãn nhắc việc bằng chữ', () => {
  it('không cờ nào → không nhãn', () => {
    expect(badgesOf(visit('A', AT[10]))).toEqual([])
  })

  it('đủ cờ → đủ nhãn', () => {
    const labels = badgesOf(visit('A', AT[10], {
      isNewRequest: true, needsReminderCall: true, needsOutcome: true,
      appointments: [{ _id: 'a1', status: 'CONFIRMED', car: { _id: 'c1', status: 'DELISTED' } }],
    })).map((b) => b.key)
    expect(labels).toEqual(['new', 'reminder', 'outcome', 'unavailable'])
  })

  it('lượt thiếu dữ liệu không làm văng lỗi', () => {
    expect(() => badgesOf({})).not.toThrow()
    expect(() => badgesOf(null)).not.toThrow()
  })
})
