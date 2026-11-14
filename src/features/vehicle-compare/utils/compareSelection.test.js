import { describe, it, expect } from 'vitest'
import {
  isCompareId,
  toCompareItem,
  sanitizeStored,
  addItem,
  removeItem,
  pruneIds,
  hasItem,
} from './compareSelection'

const A = '6adf875aa9c95c345bcfdd11'
const B = '6adf875aa9c95c345bcfdd0a'
const C = '6adf875aa9c95c345bcfdd03'
const D = '6adf875aa9c95c345bcfdd04'
const item = (id) => ({ id, title: `Xe ${id.slice(-2)}`, image: null, price: 1 })

describe('isCompareId', () => {
  it('chỉ nhận chuỗi 24 hex', () => {
    expect(isCompareId(A)).toBe(true)
    expect(isCompareId('12')).toBe(false)
    expect(isCompareId(123)).toBe(false)
    expect(isCompareId(undefined)).toBe(false)
  })
})

describe('toCompareItem', () => {
  it('đọc xe dạng BE (camelCase, ảnh là đối tượng, ưu tiên ảnh chính)', () => {
    const car = {
      _id: A, make: 'KIA', model: 'Sonet', variant: 'Premium', price: 555000000,
      images: [{ url: 'a.jpg', isPrimary: false }, { url: 'b.jpg', isPrimary: true }],
    }
    expect(toCompareItem(car)).toEqual({ id: A, title: 'KIA Sonet Premium', image: 'b.jpg', price: 555000000 })
  })

  it('đọc xe dạng dữ liệu mẫu có id hex (ảnh là chuỗi, giá listedPrice)', () => {
    const car = { id: A.toUpperCase(), brand: 'Toyota', model: 'Vios', images: ['x.jpg'], listedPrice: 400 }
    expect(toCompareItem(car)).toEqual({ id: A, title: 'Toyota Vios', image: 'x.jpg', price: 400 })
  })

  it('xe không có id hex (dữ liệu mẫu) → null', () => {
    expect(toCompareItem({ id: 7, make: 'X' })).toBeNull()
    expect(toCompareItem({ _id: 'abc' })).toBeNull()
    expect(toCompareItem(null)).toBeNull()
  })

  it('thiếu thông tin vẫn trả giá trị mặc định', () => {
    expect(toCompareItem({ _id: A })).toEqual({ id: A, title: 'Xe', image: null, price: null })
  })
})

describe('addItem', () => {
  it('thêm xe mới', () => {
    expect(addItem([], item(A))).toEqual({ items: [item(A)], status: 'added' })
  })

  it('không thêm trùng (không phân biệt hoa/thường)', () => {
    const result = addItem([item(A)], { ...item(A), id: A.toUpperCase() })
    expect(result.status).toBe('duplicate')
    expect(result.items).toHaveLength(1)
  })

  it('chặn khi đã đủ 3 xe', () => {
    const result = addItem([item(A), item(B), item(C)], item(D))
    expect(result.status).toBe('full')
    expect(result.items).toHaveLength(3)
  })

  it('từ chối mục không hợp lệ', () => {
    expect(addItem([], { id: 'abc' }).status).toBe('invalid')
    expect(addItem([], null).status).toBe('invalid')
  })
})

describe('removeItem / pruneIds / hasItem', () => {
  const list = [item(A), item(B), item(C)]

  it('bỏ một xe', () => {
    expect(removeItem(list, B.toUpperCase()).map((x) => x.id)).toEqual([A, C])
    expect(hasItem(list, B)).toBe(true)
  })

  it('bỏ nhiều xe không còn bán', () => {
    expect(pruneIds(list, [A, C]).map((x) => x.id)).toEqual([B])
    expect(pruneIds(list, undefined)).toHaveLength(3)
  })
})

describe('sanitizeStored', () => {
  it('dữ liệu không phải mảng → rỗng', () => {
    expect(sanitizeStored(null)).toEqual([])
    expect(sanitizeStored('abc')).toEqual([])
    expect(sanitizeStored({ id: A })).toEqual([])
  })

  it('bỏ mục sai dạng, trùng và cắt còn tối đa 3', () => {
    const raw = [
      { id: A, title: 'A', image: 'a.jpg', price: 1 },
      { id: 'bad' },
      null,
      { id: A.toUpperCase() },
      { id: B },
      { id: C, price: 'x' },
      { id: D },
    ]
    const result = sanitizeStored(raw)
    expect(result.map((x) => x.id)).toEqual([A, B, C])
    expect(result[2].price).toBeNull()
    expect(result[1].title).toBe('Xe')
  })
})
