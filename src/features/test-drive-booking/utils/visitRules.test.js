import { describe, it, expect } from 'vitest'
import { canCancel, isLateHint, isCarCancelled, staffActions, unavailableCarIds, hasUnavailableCar } from './visitRules'

const SLOT = '2026-11-10T03:00:00.000Z' // 10:00 VN
const at = (hoursBefore) => new Date(new Date(SLOT).getTime() - hoursBefore * 3600e3)
const visit = (status, extra = {}) => ({ status, scheduledAt: SLOT, appointments: [], ...extra })

describe('canCancel / isLateHint (AC-F08)', () => {
  it('hủy được khi lượt mở và chưa tới giờ', () => {
    expect(canCancel(visit('PENDING'), at(24))).toBe(true)
    expect(canCancel(visit('CONFIRMED'), at(0.5))).toBe(true)
  })

  it('không hủy được khi đã tới giờ, đã đóng hoặc thiếu dữ liệu', () => {
    expect(canCancel(visit('PENDING'), at(0))).toBe(false)
    expect(canCancel(visit('PENDING'), at(-1))).toBe(false)
    for (const status of ['CANCELLED', 'COMPLETED', 'NO_SHOW']) expect(canCancel(visit(status), at(24))).toBe(false)
    expect(canCancel(undefined, at(24))).toBe(false)
  })

  it('cảnh báo "sát giờ" chỉ khi còn dưới 12 giờ', () => {
    expect(isLateHint(visit('PENDING'), at(12))).toBe(false)
    expect(isLateHint(visit('PENDING'), at(11.9))).toBe(true)
    expect(isLateHint(visit('PENDING'), at(24))).toBe(false)
    expect(isLateHint(visit('CANCELLED'), at(5))).toBe(false)
  })
})

describe('isCarCancelled (AC-F07)', () => {
  it('lịch con đã hủy trong lượt chưa hủy = xe bị tự hủy', () => {
    expect(isCarCancelled(visit('PENDING'), { status: 'CANCELLED' })).toBe(true)
    expect(isCarCancelled(visit('PENDING'), { status: 'PENDING' })).toBe(false)
  })

  it('lượt đã hủy cả lượt thì không đánh dấu riêng từng xe', () => {
    expect(isCarCancelled(visit('CANCELLED'), { status: 'CANCELLED' })).toBe(false)
  })
})

describe('staffActions: bảng C5 (AC-F10)', () => {
  it('PENDING → xác nhận hoặc hủy', () => {
    expect(staffActions(visit('PENDING'), at(24))).toEqual(['CONFIRMED', 'CANCELLED'])
    expect(staffActions(visit('PENDING'), at(-5))).toEqual(['CONFIRMED', 'CANCELLED'])
  })

  it('CONFIRMED trước giờ → chỉ hủy; từ giờ hẹn → thêm hoàn tất, vắng mặt', () => {
    expect(staffActions(visit('CONFIRMED'), at(2))).toEqual(['CANCELLED'])
    expect(staffActions(visit('CONFIRMED'), at(0))).toEqual(['COMPLETED', 'NO_SHOW', 'CANCELLED'])
    expect(staffActions(visit('CONFIRMED'), at(-1))).toEqual(['COMPLETED', 'NO_SHOW', 'CANCELLED'])
  })

  it('trạng thái cuối không có thao tác', () => {
    for (const status of ['COMPLETED', 'NO_SHOW', 'CANCELLED']) expect(staffActions(visit(status), at(-1))).toEqual([])
    expect(staffActions(undefined)).toEqual([])
  })
})

describe('unavailableCarIds / hasUnavailableCar (AC-F09)', () => {
  const car = (id, status) => ({ _id: id, status })

  it('xe còn lịch mở nhưng không còn AVAILABLE', () => {
    const v = visit('PENDING', { appointments: [
      { status: 'PENDING', car: car('a', 'AVAILABLE') },
      { status: 'PENDING', car: car('b', 'RESERVED') },
    ] })
    expect(unavailableCarIds(v)).toEqual(['b'])
    expect(hasUnavailableCar(v)).toBe(true)
  })

  it('lịch con đã tự hủy trong lượt chưa hủy', () => {
    const v = visit('CONFIRMED', { appointments: [
      { status: 'CANCELLED', car: car('a', 'SOLD') },
      { status: 'CONFIRMED', car: car('b', 'AVAILABLE') },
    ] })
    expect(unavailableCarIds(v)).toEqual(['a'])
  })

  it('cả lượt bị hủy vì xe không còn bán → mọi xe của lượt', () => {
    const v = visit('CANCELLED', { cancellationType: 'CAR_UNAVAILABLE', appointments: [
      { status: 'CANCELLED', car: car('a', 'RESERVED') }, { status: 'CANCELLED', car: car('b', 'DELISTED') },
    ] })
    expect(unavailableCarIds(v)).toEqual(['a', 'b'])
  })

  it('mọi xe bình thường → không có', () => {
    const v = visit('PENDING', { appointments: [{ status: 'PENDING', car: car('a', 'AVAILABLE') }] })
    expect(hasUnavailableCar(v)).toBe(false)
    expect(hasUnavailableCar(visit('CANCELLED', { cancellationType: 'CUSTOMER', appointments: [{ status: 'CANCELLED', car: car('a', 'AVAILABLE') }] }))).toBe(false)
  })
})
