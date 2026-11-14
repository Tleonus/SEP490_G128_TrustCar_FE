import { describe, expect, it } from 'vitest'
import { dayLabel, inMonthOf, monthMatrix, rangeOf, shiftAnchor, titleOf, todayKey, weekDays, weekStart } from './calendarRange'

describe('todayKey: ngày hôm nay theo giờ VN, không theo múi giờ máy', () => {
  it('23:59 VN vẫn là ngày cũ, 00:00 VN sang ngày mới', () => {
    expect(todayKey(new Date('2026-11-14T16:59:00Z'))).toBe('2026-11-14')
    expect(todayKey(new Date('2026-11-14T17:00:00Z'))).toBe('2026-11-15')
  })
})

describe('weekStart / weekDays: tuần bắt đầu thứ Hai', () => {
  it('Chủ nhật 15/11/2026 thuộc tuần bắt đầu 09/11', () => {
    expect(weekStart('2026-11-15')).toBe('2026-11-09')
  })

  it('thứ Hai là chính nó', () => {
    expect(weekStart('2026-11-16')).toBe('2026-11-16')
  })

  it('đủ 7 ngày liên tiếp, qua tháng và qua năm', () => {
    expect(weekDays('2026-12-30')).toEqual([
      '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
    ])
  })
})

describe('monthMatrix', () => {
  it('tháng 11/2026 bắt đầu Chủ nhật: 6 hàng, từ 26/10 đến 06/12', () => {
    const grid = monthMatrix('2026-11-14')
    expect(grid.weeks).toHaveLength(6)
    expect(grid.from).toBe('2026-10-26')
    expect(grid.to).toBe('2026-12-06')
    expect(grid.weeks[0]).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
    expect(grid.month).toBe('2026-11')
  })

  it('tháng 2/2027 có 28 ngày và bắt đầu thứ Hai: đúng 4 hàng, không có ngày ngoài tháng', () => {
    const grid = monthMatrix('2027-02-10')
    expect(grid.weeks).toHaveLength(4)
    expect([grid.from, grid.to]).toEqual(['2027-02-01', '2027-02-28'])
  })

  it('tháng 2/2028 (năm nhuận) có 29 ngày: 5 hàng, 31/01 đến 05/03', () => {
    const grid = monthMatrix('2028-02-29')
    expect(grid.weeks).toHaveLength(5)
    expect([grid.from, grid.to]).toEqual(['2028-01-31', '2028-03-05'])
  })

  it('mọi hàng đủ 7 ngày, liên tiếp, và hàng nào cũng bắt đầu thứ Hai', () => {
    for (const anchor of ['2026-01-15', '2026-02-15', '2026-04-30', '2026-12-31', '2027-02-01']) {
      const grid = monthMatrix(anchor)
      const flat = grid.weeks.flat()
      expect(grid.weeks.every((week) => week.length === 7 && weekStart(week[0]) === week[0])).toBe(true)
      expect(new Set(flat).size).toBe(flat.length)
      expect(flat[0]).toBe(grid.from)
      expect(flat.at(-1)).toBe(grid.to)
    }
  })

  it('tháng 12 kết thúc trong tháng 1 năm sau', () => {
    expect(monthMatrix('2026-12-31').to).toBe('2027-01-03')
  })
})

describe('rangeOf', () => {
  it('tháng: bao cả ngày ngoài tháng của lưới', () => {
    expect(rangeOf('month', '2026-11-14')).toEqual({ from: '2026-10-26', to: '2026-12-06' })
  })

  it('tuần: thứ Hai đến Chủ nhật', () => {
    expect(rangeOf('week', '2026-11-14')).toEqual({ from: '2026-11-09', to: '2026-11-15' })
  })
})

describe('shiftAnchor', () => {
  it('tuần: cộng/trừ 7 ngày', () => {
    expect(shiftAnchor('week', '2026-11-14', 1)).toBe('2026-11-21')
    expect(shiftAnchor('week', '2026-11-14', -1)).toBe('2026-11-07')
  })

  it('tháng: giữ ngày, qua năm đúng chiều', () => {
    expect(shiftAnchor('month', '2026-11-14', 1)).toBe('2026-12-14')
    expect(shiftAnchor('month', '2026-12-14', 1)).toBe('2027-01-14')
    expect(shiftAnchor('month', '2027-01-14', -1)).toBe('2026-12-14')
  })

  it('tháng: 31/01 sang tháng 2 lùi về ngày cuối tháng (28 và 29 năm nhuận)', () => {
    expect(shiftAnchor('month', '2027-01-31', 1)).toBe('2027-02-28')
    expect(shiftAnchor('month', '2028-01-31', 1)).toBe('2028-02-29')
    expect(shiftAnchor('month', '2026-03-31', -1)).toBe('2026-02-28')
  })

  it('tiến rồi lùi một tháng ở cuối tháng không làm tháng đang xem sai', () => {
    const forward = shiftAnchor('month', '2026-10-31', 1)
    expect(forward).toBe('2026-11-30')
    expect(monthMatrix(forward).month).toBe('2026-11')
  })
})

describe('titleOf / inMonthOf', () => {
  it('tiêu đề tháng và tuần', () => {
    expect(titleOf('month', '2026-11-14')).toBe('Tháng 11/2026')
    expect(titleOf('week', '2026-11-14')).toBe('09/11 – 15/11/2026')
  })

  it('tuần qua năm ghi năm của ngày cuối', () => {
    expect(titleOf('week', '2026-12-30')).toBe('28/12 – 03/01/2027')
  })

  it('dayLabel: thứ và ngày đầy đủ', () => {
    expect(dayLabel('2026-11-17')).toBe('T3, 17/11/2026')
    expect(dayLabel('2026-11-15')).toBe('CN, 15/11/2026')
  })

  it('inMonthOf phân biệt ngày trong và ngoài tháng', () => {
    expect(inMonthOf('2026-11-30', '2026-11-14')).toBe(true)
    expect(inMonthOf('2026-12-01', '2026-11-14')).toBe(false)
  })
})
