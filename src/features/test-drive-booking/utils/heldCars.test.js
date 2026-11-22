import { describe, it, expect } from 'vitest'
import { heldAmong, heldCarIds, heldMessage } from './heldCars'

const NOW = new Date('2026-11-18T07:00:00Z').getTime()
const FUTURE = '2026-11-19T03:00:00.000Z'
const PAST = '2026-11-17T03:00:00.000Z'
const visit = (status, scheduledAt, appointments) => ({ status, scheduledAt, appointments })
const row = (id, status = 'PENDING') => ({ status, car: { _id: id } })

describe('heldCarIds', () => {
  it('gom xe của lượt Chờ xác nhận và Đã xác nhận chưa tới giờ', () => {
    const held = heldCarIds([
      visit('PENDING', FUTURE, [row('a')]),
      visit('CONFIRMED', FUTURE, [row('b', 'CONFIRMED'), row('c', 'CONFIRMED')]),
    ], NOW)
    expect([...held].sort()).toEqual(['a', 'b', 'c'])
  })

  it('bỏ lượt đã hủy, hoàn tất, vắng mặt', () => {
    const held = heldCarIds(['CANCELLED', 'COMPLETED', 'NO_SHOW'].map((s) => visit(s, FUTURE, [row('a', s)])), NOW)
    expect(held.size).toBe(0)
  })

  it('bỏ lượt đã qua giờ hẹn dù chưa ai chốt', () => {
    expect(heldCarIds([visit('CONFIRMED', PAST, [row('a', 'CONFIRMED')])], NOW).size).toBe(0)
  })

  it('bỏ lịch con đã hủy trong lượt còn mở (xe ngừng bán)', () => {
    const held = heldCarIds([visit('PENDING', FUTURE, [row('a', 'CANCELLED'), row('b')])], NOW)
    expect([...held]).toEqual(['b'])
  })

  it('chịu được dữ liệu thiếu, id dạng chuỗi hoặc `id`', () => {
    expect(heldCarIds(undefined, NOW).size).toBe(0)
    expect(heldCarIds([{}, null, visit('PENDING', FUTURE, undefined)], NOW).size).toBe(0)
    expect([...heldCarIds([visit('PENDING', FUTURE, [{ status: 'PENDING', car: 'x' }, { status: 'PENDING', car: { id: 'y' } }])], NOW)].sort()).toEqual(['x', 'y'])
  })

  it('lượt giờ hẹn đúng bằng lúc này không còn mở', () => {
    expect(heldCarIds([visit('PENDING', new Date(NOW).toISOString(), [row('a')])], NOW).size).toBe(0)
  })
})

describe('heldAmong / heldMessage', () => {
  const selected = [{ id: 'a', title: 'MAZDA CX-5' }, { id: 'b', title: 'TOYOTA Camry' }]

  it('chỉ trả các xe đã chọn đang bị giữ', () => {
    expect(heldAmong(selected, new Set(['b', 'z']))).toEqual([selected[1]])
    expect(heldAmong(selected, new Set())).toEqual([])
    expect(heldAmong(undefined, new Set(['a']))).toEqual([])
  })

  it('câu báo khớp với thông báo của BE', () => {
    expect(heldMessage([selected[0]])).toBe('Bạn đã có lịch cho xe MAZDA CX-5.')
    expect(heldMessage(selected)).toBe('Bạn đã có lịch cho xe MAZDA CX-5, TOYOTA Camry.')
  })
})
