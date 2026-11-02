import { describe, it, expect } from 'vitest'
import { labelFor, FUEL_TYPE_LABEL, CONDITION_GRADE_LABEL, NOT_UPDATED } from './compareLabels'

describe('labelFor', () => {
  it('dịch enum của BE (chữ hoa)', () => {
    expect(labelFor(FUEL_TYPE_LABEL, 'GASOLINE')).toBe('Xăng')
    expect(labelFor(CONDITION_GRADE_LABEL, 'B')).toBe('B – Tốt')
  })

  it('giá trị lạ hiện nguyên văn', () => {
    expect(labelFor(FUEL_TYPE_LABEL, 'HYDROGEN')).toBe('HYDROGEN')
  })

  it('null, undefined hoặc rỗng → "Chưa cập nhật"', () => {
    expect(labelFor(FUEL_TYPE_LABEL, null)).toBe(NOT_UPDATED)
    expect(labelFor(FUEL_TYPE_LABEL, undefined)).toBe(NOT_UPDATED)
    expect(labelFor(FUEL_TYPE_LABEL, '')).toBe(NOT_UPDATED)
  })
})
