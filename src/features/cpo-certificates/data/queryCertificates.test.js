import { describe, it, expect } from 'vitest'
import { queryCertificates } from './queryCertificates'

const item = (n, overrides = {}) => ({
  carId: `car-${n}`,
  vehicleCode: `TC-2026-000${n}`,
  certificateId: `CPO-2026100${n}-000${n}`,
  issuedAt: `2026-10-0${n}T03:00:00.000Z`,
  carStatus: 'AVAILABLE',
  vehicle: { make: 'Toyota', model: 'Camry', mileage: n * 10000 },
  ...overrides,
})

const items = [
  item(1),
  item(2, { carStatus: 'SOLD', vehicle: { make: 'Mazda', model: 'CX-5', mileage: 5000 } }),
  item(3, { carStatus: 'APPROVED_CPO' }),
]

describe('queryCertificates', () => {
  it('mặc định sắp ngày cấp mới nhất trước', () => {
    expect(queryCertificates(items).items.map((i) => i.carId)).toEqual(['car-3', 'car-2', 'car-1'])
  })

  it.each([
    ['mã CPO', 'cpo-20261002', ['car-2']],
    ['mã xe', 'tc-2026-0003', ['car-3']],
    ['hãng', 'mazda', ['car-2']],
    ['dòng', 'CAMRY', ['car-3', 'car-1']],
  ])('tìm theo %s, không phân biệt hoa thường', (_, search, expected) => {
    expect(queryCertificates(items, { search }).items.map((i) => i.carId)).toEqual(expected)
  })

  it('lọc theo trạng thái xe', () => {
    expect(queryCertificates(items, { status: 'SOLD' }).items.map((i) => i.carId)).toEqual(['car-2'])
  })

  it('lọc khoảng ngày cấp, bao gồm cả hai đầu', () => {
    const result = queryCertificates(items, { issuedFrom: '2026-10-02', issuedTo: '2026-10-03' })
    expect(result.items.map((i) => i.carId)).toEqual(['car-3', 'car-2'])
  })

  it('ngày cấp tính theo giờ Việt Nam', () => {
    const late = [item(1, { issuedAt: '2026-10-01T18:30:00.000Z' })] // 01:30 ngày 02/10 giờ VN
    expect(queryCertificates(late, { issuedFrom: '2026-10-02' }).total).toBe(1)
  })

  it('sắp theo mã CPO tăng dần', () => {
    expect(queryCertificates(items, { sort: 'certificateId:asc' }).items.map((i) => i.carId)).toEqual(['car-1', 'car-2', 'car-3'])
  })

  it('xe thiếu ngày cấp vẫn hiện, nhưng bị loại khi lọc theo ngày', () => {
    const withMissing = [...items, item(4, { issuedAt: null })]
    expect(queryCertificates(withMissing).total).toBe(4)
    expect(queryCertificates(withMissing, { issuedFrom: '2026-10-01' }).total).toBe(3)
  })

  it('phân trang và kẹp trang vượt quá', () => {
    expect(queryCertificates(items, { limit: 2, page: 2 })).toMatchObject({ total: 3, page: 2, totalPages: 2 })
    expect(queryCertificates(items, { limit: 2, page: 99 }).page).toBe(2)
  })

  it('rỗng vẫn trả 1 trang', () => {
    expect(queryCertificates([], {})).toMatchObject({ items: [], total: 0, page: 1, totalPages: 1 })
  })
})
