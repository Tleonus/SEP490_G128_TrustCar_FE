import { describe, expect, it } from 'vitest'
import { carsLink, dateBounds, stepError, suggestCars, summaryRows, toDateInput } from './consult'

const NOW = new Date(2026, 10, 20, 9, 0) // 20/11/2026

const cars = [
  { vehicleCode: 'TC-2026-0001', bodyType: 'SUV', price: 1250000000 },
  { vehicleCode: 'TC-2026-0003', bodyType: 'SUV', price: 1150000000 },
  { vehicleCode: 'TC-2026-0019', bodyType: 'SEDAN', price: 1025000000 },
  { vehicleCode: 'TC-2026-0004', bodyType: 'SUV', price: 870000000 },
  { vehicleCode: 'TC-2026-0015', bodyType: 'HATCHBACK', price: 330000000 },
  { vehicleCode: 'TC-2026-0099', bodyType: 'SUV', price: null },
]

describe('showroom-3d consult', () => {
  it('tên: bắt buộc, cắt khoảng trắng, tối đa 60 ký tự', () => {
    expect(stepError('name', { name: '   ' }, NOW)).toMatch(/nhập tên/)
    expect(stepError('name', { name: 'a'.repeat(61) }, NOW)).toMatch(/60/)
    expect(stepError('name', { name: ' Minh ' }, NOW)).toBeNull()
  })

  it('các câu chọn: phải chọn đúng giá trị có trong danh sách', () => {
    expect(stepError('need', { need: 'x' }, NOW)).not.toBeNull()
    expect(stepError('need', { need: 'family' }, NOW)).toBeNull()
    expect(stepError('budget', {}, NOW)).not.toBeNull()
    expect(stepError('payment', { payment: 'loan' }, NOW)).toBeNull()
  })

  it('ngày lái thử: từ hôm nay đến 60 ngày tới và phải chọn buổi', () => {
    const { min, max } = dateBounds(NOW)
    expect(min).toBe('2026-11-20')
    expect(max).toBe('2027-01-19')
    expect(stepError('visit', { date: '2026-11-19', session: 'morning' }, NOW)).not.toBeNull()
    expect(stepError('visit', { date: '2027-01-20', session: 'morning' }, NOW)).not.toBeNull()
    expect(stepError('visit', { date: '2026-11-20' }, NOW)).toMatch(/buổi/)
    expect(stepError('visit', { date: '2026-11-20', session: 'afternoon' }, NOW)).toBeNull()
  })

  it('chưa muốn lái thử: không cần ngày, tóm tắt ghi "Chưa"', () => {
    expect(stepError('visit', { session: 'none' }, NOW)).toBeNull()
    expect(stepError('visit', { session: 'none', date: '2020-01-01' }, NOW)).toBeNull()
    expect(summaryRows({ name: 'A', session: 'none', date: '2026-11-21' }).at(-1).value).toBe('Chưa')
  })

  it('toDateInput theo giờ máy', () => {
    expect(toDateInput(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('tóm tắt đọc được', () => {
    const rows = summaryRows({ name: ' Minh ', need: 'family', budget: '800-1200', payment: 'loan', date: '2026-11-21', session: 'morning' })
    expect(rows.map((r) => r.value)).toEqual(['Minh', 'Gia đình, đi chơi xa', '800 triệu – 1,2 tỷ', 'Trả góp', 'Sáng, 21/11/2026'])
  })

  it('gợi ý: trong ngân sách, ưu tiên đúng kiểu dáng, rẻ trước, tối đa 3, bỏ xe không có giá', () => {
    const picks = suggestCars(cars, { need: 'family', budget: '800-1200' })
    expect(picks.map((c) => c.vehicleCode)).toEqual(['TC-2026-0004', 'TC-2026-0003', 'TC-2026-0019'])
    expect(suggestCars(cars, { need: 'family', budget: 'o1200' }).map((c) => c.vehicleCode)).toEqual(['TC-2026-0001'])
    expect(suggestCars(cars, { need: 'commute' })).toEqual([])
  })

  it('link danh sách xe lọc theo ngân sách', () => {
    expect(carsLink({ budget: 'u500' })).toBe('/xe?priceMax=500000000')
    expect(carsLink({ budget: 'o1200' })).toBe('/xe?priceMin=1200000000')
    expect(carsLink({})).toBe('/xe')
  })
})
