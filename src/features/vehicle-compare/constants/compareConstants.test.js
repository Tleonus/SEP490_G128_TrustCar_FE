import { describe, it, expect } from 'vitest'
import {
  MAX_COMPARE,
  MIN_COMPARE,
  COMPARE_STORAGE_KEY,
  COMPARE_PATH,
  COMPARE_ID_REGEX,
} from './compareConstants'

describe('compareConstants', () => {
  it('giới hạn 2–3 xe', () => {
    expect(MIN_COMPARE).toBe(2)
    expect(MAX_COMPARE).toBe(3)
  })

  it('khóa lưu trữ và đường dẫn', () => {
    expect(COMPARE_STORAGE_KEY).toBe('trustcar_compare')
    expect(COMPARE_PATH).toBe('/so-sanh')
  })

  it('chỉ nhận id gồm đúng 24 ký tự hex', () => {
    expect(COMPARE_ID_REGEX.test('6adf875aa9c95c345bcfdd11')).toBe(true)
    expect(COMPARE_ID_REGEX.test('6ADF875AA9C95C345BCFDD11')).toBe(true)
    expect(COMPARE_ID_REGEX.test('abc')).toBe(false)
    expect(COMPARE_ID_REGEX.test('6adf875aa9c95c345bcfdd1')).toBe(false)
    expect(COMPARE_ID_REGEX.test('6adf875aa9c95c345bcfdd1z')).toBe(false)
    expect(COMPARE_ID_REGEX.test('')).toBe(false)
  })
})
