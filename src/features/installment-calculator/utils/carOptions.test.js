import { describe, expect, it } from 'vitest'
import { carName, initialCarId, toCarOptions } from './carOptions'
import { buildInstallmentLink } from './installmentInput'

const car = (code, extra = {}) => ({
  _id: `id-${code}`, vehicleCode: code, make: 'Toyota', model: 'Vios', variant: 'G', year: 2021, price: 450_000_000,
  images: [{ url: `/img/${code}.jpg` }], ...extra,
})

describe('toCarOptions (REQ-F17)', () => {
  it('lấy tên, giá (đồng, làm tròn), ảnh đầu; sắp theo tên', () => {
    const got = toCarOptions([car('TC-2', { make: 'VinFast', model: 'VF8', variant: null, price: 900_000_000.4 }), car('TC-1')])
    expect(got.map((item) => item.id)).toEqual(['TC-1', 'TC-2'])
    expect(got[0]).toEqual({ id: 'TC-1', code: 'TC-1', name: 'Toyota Vios G 2021', price: 450_000_000, image: '/img/TC-1.jpg' })
    expect(got[1].price).toBe(900_000_000)
  })

  it('bỏ xe không có giá hợp lệ và xe trùng mã', () => {
    const got = toCarOptions([car('A', { price: null }), car('B', { price: 5_000 }), car('C'), car('C')])
    expect(got.map((item) => item.id)).toEqual(['C'])
    expect(toCarOptions(undefined)).toEqual([])
  })

  it('carName bỏ phần trống', () => {
    expect(carName({ make: 'Mazda', model: 'CX-5', year: 2020 })).toBe('Mazda CX-5 2020')
    expect(carName({ make: 'HYUNDAI', model: 'Hyundai SantaFe 2.5L', year: 2023 })).toBe('Hyundai SantaFe 2.5L 2023')
  })
})

describe('initialCarId', () => {
  const options = toCarOptions([car('TC-1'), car('TC-9', { make: 'Ford' })])

  it('?car= có trong danh sách → chọn xe đó', () => {
    expect(initialCarId(options, { carParam: 'TC-1' })).toBe('TC-1')
  })

  it('không có ?car= → xe đầu tiên; liên kết cũ chỉ có ?price= → không chọn xe', () => {
    expect(initialCarId(options)).toBe('TC-9')
    expect(initialCarId(options, { carParam: 'TC-404', hasPriceParam: true })).toBeNull()
    expect(initialCarId([], {})).toBeNull()
  })
})

describe('buildInstallmentLink mang mã xe', () => {
  it('thêm &car= khi có mã, giữ nguyên khi không có', () => {
    expect(buildInstallmentLink({ price: 800_000_000, downPercent: 30, termMonths: 60, carCode: 'TC-2026-0001' }))
      .toBe('/installment?price=800000000&down=30&term=60&car=TC-2026-0001')
    expect(buildInstallmentLink({ price: 800_000_000, downPercent: 30, termMonths: 60 }))
      .toBe('/installment?price=800000000&down=30&term=60')
  })
})
