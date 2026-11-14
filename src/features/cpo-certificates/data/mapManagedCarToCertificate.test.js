import { describe, expect, it } from 'vitest'
import { issuedAtFromCertificateId, toCertificateListItem } from './mapManagedCarToCertificate'

describe('issuedAtFromCertificateId', () => {
  it('lấy ngày cấp theo giờ Việt Nam từ mã CPO', () => {
    expect(issuedAtFromCertificateId('CPO-20261103-2780')).toBe('2026-11-02T17:00:00.000Z')
  })

  it.each([null, undefined, '', 'TC-2026-0019', 'CPO-2026113-2780', 'CPO-20261332-0001', 'CPO-20260230-0001'])(
    'trả null với mã không hợp lệ: %s',
    (code) => {
      expect(issuedAtFromCertificateId(code)).toBeNull()
    },
  )
})

describe('toCertificateListItem', () => {
  const car = {
    _id: 'abc123',
    vehicleCode: 'TC-2026-0019',
    cpoCertificateId: 'CPO-20261103-2780',
    status: 'SOLD',
    make: 'Toyota',
    model: 'Camry',
    variant: '2.5Q',
    year: 2022,
    mileage: 28500,
    vin: 'SECRETVIN',
    licensePlate: '30A-12345',
    floorPrice: 1,
    specifications: { color: 'Đen' },
  }

  it('ánh xạ trường cần thiết', () => {
    expect(toCertificateListItem(car)).toEqual({
      carId: 'abc123',
      vehicleCode: 'TC-2026-0019',
      certificateId: 'CPO-20261103-2780',
      issuedAt: '2026-11-02T17:00:00.000Z',
      carStatus: 'SOLD',
      vehicle: { make: 'Toyota', model: 'Camry', variant: '2.5Q', color: 'Đen', year: 2022, mileage: null },
    })
  })

  it('không mang theo VIN, biển số, giá sàn hay số km người bán khai báo', () => {
    const json = JSON.stringify(toCertificateListItem(car))
    expect(json).not.toContain('SECRETVIN')
    expect(json).not.toContain('30A-12345')
    expect(json).not.toContain('28500')
  })
})
