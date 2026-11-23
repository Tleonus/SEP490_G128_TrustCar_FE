import { describe, expect, it } from 'vitest'
import { buildSpecRows, carLengthMeters, carModelUrl, isVehicleCode, sortByCode } from './carSpecs'

const everest = {
  vehicleCode: 'TC-2026-0001', make: 'FORD', model: 'Everest', variant: 'Titanium 4x4', year: 2024, bodyType: 'SUV',
  fuelType: 'DIESEL', transmission: null, driveType: null, mileage: 52000, price: 1250000000,
  specifications: { engineDisplacementCC: null, horsePower: null, numberOfSeats: 7, color: 'Đen', interiorColor: 'Đen', features: [] },
}

describe('showroom-3d carSpecs', () => {
  it('chỉ nhận mã xe dạng TC-YYYY-NNNN (chặn ký tự lạ vào URL mô hình)', () => {
    expect(isVehicleCode('TC-2026-0001')).toBe(true)
    expect(isVehicleCode('tc-2026-0001')).toBe(false)
    expect(isVehicleCode('../TC-2026-0001')).toBe(false)
    expect(isVehicleCode(undefined)).toBe(false)
  })

  it('đường dẫn mô hình theo mã xe', () => {
    expect(carModelUrl('TC-2026-0007')).toBe('/showroom-3d/cars/TC-2026-0007.glb')
  })

  it('sắp theo mã xe tăng dần và bỏ xe không có mã hợp lệ', () => {
    const list = [{ vehicleCode: 'TC-2026-0010' }, { vehicleCode: 'x' }, { vehicleCode: 'TC-2026-0002' }, {}]
    expect(sortByCode(list).map((c) => c.vehicleCode)).toEqual(['TC-2026-0002', 'TC-2026-0010'])
  })

  it('chỉ hiện thông số có dữ liệu, không bịa giá trị trống', () => {
    const rows = buildSpecRows(everest)
    const labels = rows.map((r) => r.label)
    expect(labels).toEqual(['Năm sản xuất', 'Số km đã đi', 'Kiểu dáng', 'Nhiên liệu', 'Số chỗ', 'Màu ngoại thất', 'Màu nội thất'])
    expect(rows.find((r) => r.label === 'Nhiên liệu').value).toBe('Dầu diesel')
    expect(rows.find((r) => r.label === 'Số km đã đi').value).toMatch(/52.000 km/)
    expect(labels).not.toContain('Hộp số')
    expect(labels).not.toContain('Động cơ')
  })

  it('định dạng động cơ / công suất khi có', () => {
    const rows = buildSpecRows({ ...everest, specifications: { engineDisplacementCC: 1996, horsePower: 180, torqueNm: 420 } })
    expect(rows.find((r) => r.label === 'Động cơ').value).toBe('1.996 cc')
    expect(rows.find((r) => r.label === 'Công suất').value).toBe('180 mã lực')
    expect(rows.find((r) => r.label === 'Mô-men xoắn').value).toBe('420 Nm')
  })

  it('không có xe thì không có dòng nào', () => {
    expect(buildSpecRows(null)).toEqual([])
  })

  it('chiều dài đặt mô hình theo kiểu dáng, mặc định 4,6 m', () => {
    expect(carLengthMeters('PICKUP')).toBe(5.3)
    expect(carLengthMeters('UNKNOWN')).toBe(4.6)
  })
})

describe('showroom-3d carPhotos', () => {
  it('ảnh thư mục xe trước, rồi ảnh database (ảnh chính trước), bỏ trùng', async () => {
    const { carPhotos, carCoverUrl } = await import('./carSpecs')
    const car = {
      showroomPhotos: ['/a/1.webp', '/a/2.webp'],
      images: [{ url: 'https://cdn/x.jpg' }, { url: 'https://cdn/main.jpg', isPrimary: true }, { url: '/a/1.webp' }],
    }
    expect(carPhotos(car)).toEqual(['/a/1.webp', '/a/2.webp', 'https://cdn/main.jpg', 'https://cdn/x.jpg'])
    expect(carCoverUrl(car)).toBe('/a/1.webp')
    expect(carPhotos({})).toEqual([])
    expect(carCoverUrl({ images: [{ url: 'https://cdn/main.jpg' }] })).toBe('https://cdn/main.jpg')
  })
})
