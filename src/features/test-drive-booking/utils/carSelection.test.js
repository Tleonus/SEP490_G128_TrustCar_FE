import { describe, it, expect } from 'vitest'
import {
  isCarId, toCarItem, canAdd, addCar, removeCar, carIdsOf, carNamesOf, splitSearch, matchesTerms,
} from './carSelection'

const hex = (n) => String(n).padStart(24, 'a').slice(-24)
const item = (n, title = `Xe ${n}`) => ({ id: hex(n), title, vehicleCode: `TC-${n}`, image: null })

describe('toCarItem', () => {
  it('lấy id, tên, mã xe và ảnh chính từ xe của API công khai', () => {
    const car = {
      _id: hex(1).toUpperCase(), make: 'MAZDA', model: 'CX-5', variant: '2.0', vehicleCode: 'TC-2026-0001',
      images: [{ url: 'https://img/a.jpg', isPrimary: false }, { url: 'https://img/b.jpg', isPrimary: true }],
    }
    expect(toCarItem(car)).toEqual({ id: hex(1), title: 'MAZDA CX-5 2.0', vehicleCode: 'TC-2026-0001', image: 'https://img/b.jpg' })
  })

  it('xe dữ liệu mẫu (id không phải 24 hex) hoặc thiếu id → null', () => {
    expect(toCarItem({ id: 'car-5', make: 'KIA' })).toBeNull()
    expect(toCarItem({ make: 'KIA' })).toBeNull()
    expect(toCarItem(null)).toBeNull()
  })

  it('xe không ảnh vẫn dùng được', () => {
    expect(toCarItem({ _id: hex(2), make: 'KIA', model: 'Sonet' }).image).toBeNull()
  })
})

describe('canAdd / addCar (tối đa 3 xe, AC-F02)', () => {
  it('thêm đến khi đủ 3 xe thì báo full', () => {
    let list = [item(1)]
    expect(canAdd(list, hex(2))).toBe('ok')
    list = addCar(list, item(2))
    list = addCar(list, item(3))
    expect(list).toHaveLength(3)
    expect(canAdd(list, hex(4))).toBe('full')
    expect(addCar(list, item(4))).toBe(list)
  })

  it('không thêm xe trùng (kể cả khác hoa/thường) hoặc id không hợp lệ', () => {
    const list = [item(1)]
    expect(canAdd(list, hex(1).toUpperCase())).toBe('duplicate')
    expect(canAdd(list, 'abc')).toBe('invalid')
    expect(canAdd(list, undefined)).toBe('invalid')
    expect(addCar(list, item(1))).toBe(list)
    expect(addCar(list, null)).toBe(list)
  })
})

describe('removeCar', () => {
  it('bỏ được xe thêm sau, không bỏ được xe đang xem', () => {
    const list = [item(1), item(2)]
    expect(removeCar(list, hex(2), hex(1))).toEqual([item(1)])
    expect(removeCar(list, hex(1), hex(1))).toBe(list)
    expect(removeCar(list, hex(1).toUpperCase(), hex(1))).toBe(list)
  })
})

describe('tìm xe nhiều từ (API chỉ khớp từng trường riêng lẻ)', () => {
  it('splitSearch gửi API từ dài nhất và giữ mọi từ để lọc lại', () => {
    expect(splitSearch('  Mazda   CX-5 ')).toEqual({ apiTerm: 'mazda', terms: ['mazda', 'cx-5'] })
    expect(splitSearch('SMOKE FE Z')).toEqual({ apiTerm: 'smoke', terms: ['smoke', 'fe', 'z'] })
    expect(splitSearch('kia')).toEqual({ apiTerm: 'kia', terms: ['kia'] })
    expect(splitSearch('   ')).toEqual({ apiTerm: '', terms: [] })
    expect(splitSearch(undefined)).toEqual({ apiTerm: '', terms: [] })
  })

  it('matchesTerms: phải chứa mọi từ, không phân biệt hoa/thường, tìm cả mã xe', () => {
    const car = { id: hex(1), title: 'MAZDA CX-5 2.0', vehicleCode: 'TC-2026-0001' }
    expect(matchesTerms(car, ['mazda', 'cx-5'])).toBe(true)
    expect(matchesTerms(car, ['mazda', 'cx-8'])).toBe(false)
    expect(matchesTerms(car, ['tc-2026-0001'])).toBe(true)
    expect(matchesTerms(car, [])).toBe(true)
    expect(matchesTerms({ id: hex(2), title: 'KIA Sonet', vehicleCode: null }, ['kia', 'sonet'])).toBe(true)
  })
})

describe('tiện ích', () => {
  it('isCarId, carIdsOf, carNamesOf', () => {
    expect(isCarId(hex(1))).toBe(true)
    expect(isCarId('xyz')).toBe(false)
    expect(carIdsOf([item(1), item(2)])).toEqual([hex(1), hex(2)])
    expect(carNamesOf([item(1, 'A')])).toEqual({ [hex(1)]: 'A' })
  })
})
