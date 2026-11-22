/* global process */
import { afterEach, describe, expect, it } from 'vitest'
import { formatDob, isValidDob, todayLocalISO } from './dob'

const TODAY = '2026-11-14'
const ORIGINAL_TZ = process.env.TZ
afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ
  else process.env.TZ = ORIGINAL_TZ
})

describe('isValidDob', () => {
  it('chấp nhận hôm nay, ngày đầu tiên cho phép và ngày nhuận có thật', () => {
    expect(isValidDob(TODAY, TODAY)).toBe(true)
    expect(isValidDob('1900-01-01', TODAY)).toBe(true)
    expect(isValidDob('2024-02-29', TODAY)).toBe(true)
    expect(isValidDob('2000-05-20', TODAY)).toBe(true)
  })

  it('từ chối ngày mai và mọi ngày trong tương lai', () => {
    expect(isValidDob('2026-11-15', TODAY)).toBe(false)
    expect(isValidDob('2999-01-01', TODAY)).toBe(false)
  })

  it('từ chối ngày trước 1900-01-01', () => {
    expect(isValidDob('1899-12-31', TODAY)).toBe(false)
    expect(isValidDob('1800-01-01', TODAY)).toBe(false)
  })

  it('từ chối ngày không có thật', () => {
    for (const bad of ['2000-02-31', '2023-02-29', '1900-02-29', '2000-13-01', '2000-00-10', '2000-04-31', '2000-01-00']) {
      expect(isValidDob(bad, TODAY)).toBe(false)
    }
  })

  it('từ chối sai định dạng và kiểu dữ liệu lạ', () => {
    for (const bad of ['', 'abc', '20000520', '2000-5-20', '20/05/2000', null, undefined, 20000520]) {
      expect(isValidDob(bad, TODAY)).toBe(false)
    }
  })
})

describe('formatDob (AC-F23)', () => {
  it('hiển thị đúng ngày đã nhập dạng dd/mm/yyyy', () => {
    expect(formatDob('2000-05-20')).toBe('20/05/2000')
    expect(formatDob('1999-12-31')).toBe('31/12/1999')
  })

  it('rỗng hoặc không hợp lệ cho chuỗi rỗng', () => {
    for (const empty of [null, undefined, '', 'abc']) expect(formatDob(empty)).toBe('')
  })

  it.each(['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles', 'Pacific/Pago_Pago', 'Pacific/Kiritimati'])(
    'không lệch ngày ở múi giờ %s',
    (zone) => {
      process.env.TZ = zone
      expect(formatDob('2000-05-20')).toBe('20/05/2000')
      expect(formatDob('2000-01-01')).toBe('01/01/2000')
      expect(isValidDob('2000-05-20', TODAY)).toBe(true)
      expect(isValidDob(TODAY, TODAY)).toBe(true)
      expect(isValidDob('2000-02-30', TODAY)).toBe(false)
    },
  )
})

describe('todayLocalISO', () => {
  it('lấy ngày theo giờ địa phương, kể cả sát nửa đêm', () => {
    expect(todayLocalISO(new Date(2026, 10, 14, 23, 59, 59))).toBe('2026-11-14')
    expect(todayLocalISO(new Date(2026, 10, 15, 0, 0, 1))).toBe('2026-11-15')
  })

  it('thêm số 0 ở tháng và ngày một chữ số, qua ranh giới năm', () => {
    expect(todayLocalISO(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
    expect(todayLocalISO(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31')
  })

  it.each(['UTC', 'Asia/Ho_Chi_Minh', 'Pacific/Pago_Pago'])('đúng ở múi giờ %s khi tạo ngày theo giờ địa phương', (zone) => {
    process.env.TZ = zone
    expect(todayLocalISO(new Date(2026, 10, 14, 0, 30))).toBe('2026-11-14')
    expect(todayLocalISO(new Date(2026, 10, 14, 23, 30))).toBe('2026-11-14')
  })
})
