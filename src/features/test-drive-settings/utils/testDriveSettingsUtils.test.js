import { describe, expect, it } from 'vitest'
import { getSettingsErrorMessage } from './settingsErrors'
import { buildCapacityChanges, FIXED_SLOT_STARTS, maxGuestsPerDay, validateMaxGuests } from './testDriveCapacity'

const apiError = (status, data) => ({ response: { status, data } })

describe('validateMaxGuests', () => {
  it.each([1, 2, 3, 100])('chấp nhận %i', (value) => {
    expect(validateMaxGuests(value)).toBeNull()
  })

  it.each([0, -1, 101, 2.5, Number.NaN, null, undefined, '3'])('từ chối %p', (value) => {
    expect(validateMaxGuests(value)).toBe('Số khách mỗi khung phải từ 1 đến 100.')
  })
})

describe('maxGuestsPerDay', () => {
  it('nhân số khung cố định với sức chứa', () => {
    expect(maxGuestsPerDay(3)).toBe(FIXED_SLOT_STARTS.length * 3)
    expect(maxGuestsPerDay(0)).toBe(0)
    expect(maxGuestsPerDay(undefined)).toBe(0)
  })
})

describe('buildCapacityChanges', () => {
  const saved = { openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', slotDurationMinutes: 60, maxGuestsPerSlot: 3 }

  it('chỉ gửi số khách khi nó đổi, các trường ẩn không bao giờ bị gửi', () => {
    expect(buildCapacityChanges({ ...saved, maxGuestsPerSlot: 2 }, saved)).toEqual({ maxGuestsPerSlot: 2 })
  })

  it('không gửi gì khi không đổi', () => {
    expect(buildCapacityChanges({ ...saved }, saved)).toEqual({})
  })
})

describe('getSettingsErrorMessage', () => {
  it('dùng chi tiết của lỗi kiểm tra cấu hình', () => {
    const error = apiError(422, { code: 'VALIDATION_ERROR', errors: [{ field: 'testDrive', message: 'Sai giờ' }] })
    expect(getSettingsErrorMessage(error)).toBe('Sai giờ')
  })

  it('báo lỗi mạng và lỗi máy chủ', () => {
    expect(getSettingsErrorMessage(new Error('Network Error'))).toContain('kết nối')
    expect(getSettingsErrorMessage(apiError(500, { code: 'INTERNAL_ERROR' }))).toContain('Máy chủ')
  })
})
