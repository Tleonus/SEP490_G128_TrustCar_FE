import { describe, it, expect } from 'vitest'
import { describeStaffSlot, summarizeVisit } from './staffSlotGrid'

const visit = (extra) => ({
  visitId: 'v1',
  visitCode: 'APT-0001',
  status: 'CONFIRMED',
  customer: { _id: 'c1', fullName: 'Nguyễn Văn A', phone: '0901234567' },
  cars: [{ _id: 'a1', vehicleCode: 'TC-001', make: 'Mazda', model: 'CX-5' }],
  ...extra,
})

describe('describeStaffSlot (AC-F25, AC-F26)', () => {
  it('khung còn chỗ: chọn được, nêu số chỗ còn lại', () => {
    const result = describeStaffSlot({ start: '2026-11-12T10:00:00+07:00', available: true, capacityRemaining: 1, reason: null, visits: [] })
    expect(result).toMatchObject({ time: '10:00', selectable: true, past: false, remaining: 1, note: 'còn 1 chỗ', label: '10:00 - còn 1 chỗ' })
  })

  it('PAST: mờ, không chọn được, nêu "Đã qua"', () => {
    const result = describeStaffSlot({ start: '2026-11-10T08:00:00+07:00', available: false, capacityRemaining: 0, reason: 'PAST' })
    expect(result).toMatchObject({ selectable: false, past: true, note: 'Đã qua', label: '08:00 - Đã qua' })
  })

  it('CAPACITY_FULL: "Đã kín chỗ", vẫn xem được khách đang đặt', () => {
    const result = describeStaffSlot({
      start: '2026-11-12T13:00:00+07:00', available: false, capacityRemaining: 0, reason: 'CAPACITY_FULL', visits: [visit(), visit({ visitId: 'v2', visitCode: 'APT-0002' })],
    })
    expect(result).toMatchObject({ selectable: false, past: false, note: 'Đã kín chỗ', remaining: 0 })
    expect(result.visits).toHaveLength(2)
  })

  it('CAR_BOOKED nêu tên xe bị kín; không biết tên thì bỏ phần tên', () => {
    const slot = { start: '2026-11-12T15:00:00+07:00', available: false, capacityRemaining: 1, reason: 'CAR_BOOKED', carIds: ['a1', 'b2'] }
    expect(describeStaffSlot(slot, { a1: 'Mazda CX-5', b2: 'Kia Sonet' }).note).toBe('Xe đã có lịch: Mazda CX-5, Kia Sonet')
    expect(describeStaffSlot(slot, {}).note).toBe('Xe đã có lịch')
    expect(describeStaffSlot(slot).note).toBe('Xe đã có lịch')
  })

  it('lý do lạ hoặc thiếu → "Không đặt được", không vỡ', () => {
    expect(describeStaffSlot({ start: '2026-11-12T08:00:00+07:00', available: false, reason: 'NEW' }).note).toBe('Không đặt được')
    expect(describeStaffSlot({ start: '2026-11-12T08:00:00+07:00', available: false }).selectable).toBe(false)
  })

  it('available phải đúng `true`; capacityRemaining lạ → 0, không âm', () => {
    expect(describeStaffSlot({ start: '2026-11-12T08:00:00+07:00', available: 'true' }).selectable).toBe(false)
    expect(describeStaffSlot({ start: '2026-11-12T08:00:00+07:00', available: true, capacityRemaining: -2 }).remaining).toBe(0)
    expect(describeStaffSlot({ start: '2026-11-12T08:00:00+07:00', available: true, capacityRemaining: 'x' }).remaining).toBe(0)
  })

  it('dữ liệu rỗng không làm vỡ', () => {
    expect(describeStaffSlot(undefined)).toMatchObject({ selectable: false, visits: [], remaining: 0 })
    expect(describeStaffSlot({ start: '2026-11-12T08:00:00+07:00', visits: 'x' }).visits).toEqual([])
  })

  it('giờ luôn theo giờ VN', () => {
    expect(describeStaffSlot({ start: '2026-11-12T03:00:00Z', available: true }).time).toBe('10:00')
  })
})

describe('summarizeVisit', () => {
  it('trả tên, SĐT, xe, nhãn trạng thái tiếng Việt', () => {
    expect(summarizeVisit(visit())).toEqual({
      key: 'v1', code: 'APT-0001', statusLabel: 'Đã xác nhận', statusColor: 'green',
      name: 'Nguyễn Văn A', phone: '0901234567', cars: 'Mazda CX-5',
    })
  })

  it('nhiều xe nối bằng dấu phẩy; thiếu make/model dùng mã xe', () => {
    const result = summarizeVisit(visit({
      cars: [{ _id: 'a1', make: 'Mazda', model: 'CX-5' }, { _id: 'b2', vehicleCode: 'TC-009' }, {}],
    }))
    expect(result.cars).toBe('Mazda CX-5, TC-009, Xe')
  })

  it('thiếu khách/xe không làm vỡ', () => {
    expect(summarizeVisit({ visitCode: 'APT-9', status: 'PENDING' })).toMatchObject({ name: '', phone: '', cars: '', statusLabel: 'Chờ xác nhận' })
    expect(summarizeVisit(undefined)).toMatchObject({ name: '', cars: '' })
  })
})
