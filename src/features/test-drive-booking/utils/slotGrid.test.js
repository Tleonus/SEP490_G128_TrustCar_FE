import { describe, it, expect } from 'vitest'
import { groupDays, firstAvailableDay, isSelectable, findSlot, describeSlot } from './slotGrid'

const slot = (start, extra = {}) => ({ start, available: true, ...extra })

// Hình dạng đúng theo BE Spec mục 5: data.days[].slots[]
const DAYS = [
  {
    date: '2026-11-10',
    slots: [
      slot('2026-11-10T08:00:00+07:00', { available: false, reason: 'TOO_SOON' }),
      slot('2026-11-10T10:00:00+07:00', { available: false, reason: 'CAPACITY_FULL' }),
      slot('2026-11-10T13:00:00+07:00', { available: false, reason: 'CAR_BOOKED', carIds: ['a1', 'b2'] }),
      slot('2026-11-10T15:00:00+07:00', { available: false, reason: 'ALREADY_BOOKED' }),
    ],
  },
  {
    date: '2026-11-11',
    slots: [
      slot('2026-11-11T08:00:00+07:00'),
      slot('2026-11-11T10:00:00+07:00', { available: false, reason: 'TOO_FAR' }),
    ],
  },
]

describe('groupDays', () => {
  it('thêm thứ, ngày ngắn và số khung còn trống', () => {
    const [first, second] = groupDays(DAYS)
    expect(first).toMatchObject({ date: '2026-11-10', weekday: 'T3', short: '10/11', availableCount: 0 })
    expect(second).toMatchObject({ date: '2026-11-11', weekday: 'T4', availableCount: 1 })
  })

  it('chịu được dữ liệu thiếu', () => {
    expect(groupDays(undefined)).toEqual([])
    expect(groupDays([{ date: '2026-11-10' }])[0]).toMatchObject({ slots: [], availableCount: 0 })
  })
})

describe('firstAvailableDay', () => {
  it('chọn ngày gần nhất còn khung', () => {
    expect(firstAvailableDay(groupDays(DAYS))).toBe('2026-11-11')
  })

  it('không ngày nào còn khung thì chọn ngày đầu; rỗng thì null', () => {
    expect(firstAvailableDay(groupDays([DAYS[0]]))).toBe('2026-11-10')
    expect(firstAvailableDay([])).toBeNull()
    expect(firstAvailableDay(undefined)).toBeNull()
  })
})

describe('describeSlot', () => {
  it('khung trống: giờ VN và nhãn "còn trống"', () => {
    expect(describeSlot(DAYS[1].slots[0])).toEqual({
      time: '08:00', available: true, reason: null, note: 'còn trống', label: '08:00 - còn trống',
    })
  })

  it('mỗi lý do có nhãn tiếng Việt', () => {
    const labels = DAYS[0].slots.map((s) => describeSlot(s).label)
    expect(labels).toEqual([
      '08:00 - Quá gần giờ',
      '10:00 - Đã kín chỗ',
      '13:00 - Xe đã có lịch',
      '15:00 - Bạn đã đặt khung này',
    ])
    expect(describeSlot(DAYS[1].slots[1]).label).toBe('10:00 - Chưa mở đặt')
  })

  it('CAR_BOOKED kèm tên xe bị kín khi biết tên', () => {
    const result = describeSlot(DAYS[0].slots[2], { a1: 'Mazda CX-5', b2: 'Kia Sonet', zz: 'Khác' })
    expect(result.label).toBe('13:00 - Xe đã có lịch: Mazda CX-5, Kia Sonet')
    expect(result.reason).toBe('CAR_BOOKED')
  })

  it('lý do PAST (1.1.0) có nhãn "Đã qua"', () => {
    expect(describeSlot(slot('2026-11-10T08:00:00+07:00', { available: false, reason: 'PAST' })).label).toBe('08:00 - Đã qua')
  })

  it('lý do lạ vẫn có nhãn dự phòng', () => {
    expect(describeSlot(slot('2026-11-10T10:00:00+07:00', { available: false, reason: 'NEW' })).label).toBe('10:00 - Không đặt được')
  })
})

describe('isSelectable / findSlot', () => {
  it('chỉ khung available === true chọn được', () => {
    expect(isSelectable(DAYS[1].slots[0])).toBe(true)
    expect(isSelectable(DAYS[0].slots[0])).toBe(false)
    expect(isSelectable(undefined)).toBe(false)
  })

  it('tìm khung theo chuỗi start', () => {
    expect(findSlot(DAYS, '2026-11-11T08:00:00+07:00')).toBe(DAYS[1].slots[0])
    expect(findSlot(DAYS, 'nope')).toBeNull()
  })
})
