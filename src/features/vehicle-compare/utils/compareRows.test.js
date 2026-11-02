import { describe, it, expect } from 'vitest'
import { buildRows, isDifferent, onlyDifferences } from './compareRows'

const car = (overrides = {}, specs = {}) => ({
  _id: '6adf875aa9c95c345bcfdd11',
  year: 2022,
  mileage: 21000,
  bodyType: 'SUV',
  fuelType: 'GASOLINE',
  transmission: 'AUTOMATIC',
  driveType: 'FWD',
  ownerType: 'INDIVIDUAL',
  conditionGrade: 'B',
  specifications: {
    color: 'Trắng', interiorColor: 'Đen', numberOfSeats: 5, numberOfDoors: 5, engineDisplacementCC: 1497,
    horsePower: 113, torqueNm: 144, fuelConsumption: 6.5, originCountry: 'Ấn Độ', safetyRating: 'ABS, EBD',
    features: ['Camera lùi', 'Bluetooth'], ...specs,
  },
  ...overrides,
})

const rowOf = (groups, key) => groups.flatMap((g) => g.rows).find((r) => r.key === key)

describe('buildRows', () => {
  it('có bốn nhóm theo thứ tự và mỗi hàng có một ô cho mỗi xe', () => {
    const groups = buildRows([car(), car()])
    expect(groups.map((g) => g.title)).toEqual([
      'Thông tin chung', 'Động cơ và vận hành', 'Chỗ ngồi', 'An toàn và tiện nghi',
    ])
    groups.forEach((g) => g.rows.forEach((r) => expect(r.cells).toHaveLength(2)))
  })

  it('định dạng giá trị và nhãn tiếng Việt', () => {
    const groups = buildRows([car()])
    expect(rowOf(groups, 'fuelType').cells[0].text).toBe('Xăng')
    expect(rowOf(groups, 'conditionGrade').cells[0].text).toBe('B – Tốt')
    expect(rowOf(groups, 'mileage').cells[0].text).toBe('21.000 km')
    expect(rowOf(groups, 'engineDisplacementCC').cells[0].text).toBe('1.497 cc')
    expect(rowOf(groups, 'horsePower').cells[0].text).toBe('113 HP')
    expect(rowOf(groups, 'numberOfSeats').cells[0].text).toBe('5 chỗ')
    expect(rowOf(groups, 'features').cells[0].items).toEqual(['Camera lùi', 'Bluetooth'])
  })

  it('thiếu dữ liệu hiện "Chưa cập nhật"', () => {
    const bare = { _id: 'x', specifications: { features: [] } }
    const groups = buildRows([bare, {}])
    expect(rowOf(groups, 'year').cells.map((c) => c.text)).toEqual(['Chưa cập nhật', 'Chưa cập nhật'])
    expect(rowOf(groups, 'features').cells[0]).toEqual({ text: 'Chưa cập nhật', items: [] })
    expect(rowOf(groups, 'mileage').cells[1].text).toBe('Chưa cập nhật')
    expect(rowOf(groups, 'bodyType').cells[0].text).toBe('Chưa cập nhật')
  })

  it('enum lạ hiện nguyên văn', () => {
    expect(rowOf(buildRows([car({ fuelType: 'HYDROGEN' })]), 'fuelType').cells[0].text).toBe('HYDROGEN')
  })

  it('chỉ đọc các trường thuộc hợp đồng, không lộ dữ liệu nội bộ', () => {
    const leaky = car({ floorPrice: 111, vin: 'SECRET', internalNotes: 'SECRET' }, { importType: 'SECRET' })
    expect(JSON.stringify(buildRows([leaky]))).not.toMatch(/SECRET|111/)
  })

  it('danh sách rỗng hoặc không hợp lệ không gây lỗi', () => {
    expect(buildRows(undefined).every((g) => g.rows.every((r) => r.cells.length === 0))).toBe(true)
  })
})

describe('isDifferent / onlyDifferences', () => {
  it('hàng giống nhau không khác biệt, hàng khác thì có', () => {
    const groups = buildRows([car(), car({ year: 2020 })])
    expect(isDifferent(rowOf(groups, 'bodyType'))).toBe(false)
    expect(isDifferent(rowOf(groups, 'year'))).toBe(true)
  })

  it('danh sách tiện nghi so không phụ thuộc thứ tự', () => {
    const groups = buildRows([car({}, { features: ['A', 'B'] }), car({}, { features: ['B', 'A'] })])
    expect(isDifferent(rowOf(groups, 'features'))).toBe(false)
  })

  it('onlyDifferences bỏ hàng giống và nhóm trống', () => {
    const groups = onlyDifferences(buildRows([car(), car({ year: 2020 })]))
    expect(groups.map((g) => g.key)).toEqual(['general'])
    expect(groups[0].rows.map((r) => r.key)).toEqual(['year'])
  })

  it('xe giống hệt nhau → không còn hàng nào', () => {
    expect(onlyDifferences(buildRows([car(), car()]))).toEqual([])
  })
})
