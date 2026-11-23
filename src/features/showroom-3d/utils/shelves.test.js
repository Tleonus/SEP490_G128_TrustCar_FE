import { describe, expect, it } from 'vitest'
import { defaultShelves, pickerList, placeOnShelf } from './shelves'

const A = { vehicleCode: 'TC-2026-0001', make: 'FORD', model: 'Everest', variant: 'Titanium 4x4', year: 2024 }
const B = { vehicleCode: 'TC-2026-0002', make: 'FORD', model: 'Everest', variant: 'Titanium 4x2', year: 2025 }
const C = { vehicleCode: 'TC-2026-0016', make: 'HYUNDAI', model: 'Accent', variant: '1.5 AT', year: 2024 }

describe('showroom-3d shelves', () => {
  it('mặc định: 2 xe đầu có mô hình, thiếu thì kệ trống', () => {
    expect(defaultShelves([A, B, C])).toEqual({ left: A, right: B })
    expect(defaultShelves([A])).toEqual({ left: A, right: null })
    expect(defaultShelves([])).toEqual({ left: null, right: null })
  })

  it('đặt xe lên kệ; xe đang ở kệ kia thì đổi chỗ', () => {
    expect(placeOnShelf({ left: A, right: null }, 'right', C)).toEqual({ left: A, right: C })
    expect(placeOnShelf({ left: A, right: B }, 'right', A)).toEqual({ left: B, right: A })
    expect(placeOnShelf({ left: A, right: null }, 'right', A)).toEqual({ left: null, right: A })
  })

  it('danh sách chọn xe: theo mã, đánh dấu 3D, tìm không dấu theo tên / mã', () => {
    const codes = new Set(['TC-2026-0002'])
    const all = pickerList([C, B, A], codes)
    expect(all.map((x) => [x.car.vehicleCode, x.has3d])).toEqual([
      ['TC-2026-0001', false], ['TC-2026-0002', true], ['TC-2026-0016', false],
    ])
    expect(pickerList([A, B, C], codes, 'hyundai').map((x) => x.car.vehicleCode)).toEqual(['TC-2026-0016'])
    expect(pickerList([A, B, C], codes, '0002').map((x) => x.car.vehicleCode)).toEqual(['TC-2026-0002'])
    expect(pickerList([A, B, C], codes, 'ÉVEREST 4X2').map((x) => x.car.vehicleCode)).toEqual(['TC-2026-0002'])
    expect(pickerList([A, B, C], codes, '', true).map((x) => x.car.vehicleCode)).toEqual(['TC-2026-0002'])
  })
})
