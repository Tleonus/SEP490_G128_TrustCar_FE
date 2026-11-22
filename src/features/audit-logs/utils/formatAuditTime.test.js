import { describe, expect, it } from 'vitest'
import { formatAuditTime } from './formatAuditTime'

describe('formatAuditTime: giờ VN có giây, độc lập múi giờ trình duyệt', () => {
  it('17:30Z ngày 14 là 00:30:00 ngày 15 (giờ VN)', () => {
    expect(formatAuditTime('2026-11-14T17:30:00Z')).toBe('15/11/2026 00:30:00')
  })

  it('ranh giới nửa đêm VN', () => {
    expect(formatAuditTime('2026-11-15T16:59:59.999Z')).toBe('15/11/2026 23:59:59')
    expect(formatAuditTime('2026-11-15T17:00:00.000Z')).toBe('16/11/2026 00:00:00')
  })

  it('có giây và định dạng dd/mm/yyyy hh:mm:ss', () => {
    expect(formatAuditTime('2026-01-05T03:04:05Z')).toBe('05/01/2026 10:04:05')
    expect(formatAuditTime('2026-12-31T20:00:00Z')).toBe('01/01/2027 03:00:00')
  })

  it('chấp nhận Date và số mili giây', () => {
    expect(formatAuditTime(new Date('2026-11-14T17:30:00Z'))).toBe('15/11/2026 00:30:00')
    expect(formatAuditTime(Date.UTC(2026, 10, 14, 17, 30, 0))).toBe('15/11/2026 00:30:00')
  })

  it('thiếu hoặc không hợp lệ → chuỗi rỗng', () => {
    expect(formatAuditTime(null)).toBe('')
    expect(formatAuditTime(undefined)).toBe('')
    expect(formatAuditTime('')).toBe('')
    expect(formatAuditTime('không phải ngày')).toBe('')
  })

  it('kết quả giống hệt dù ISO ghi bằng giờ VN hay giờ UTC', () => {
    expect(formatAuditTime('2026-11-15T00:30:00+07:00')).toBe(formatAuditTime('2026-11-14T17:30:00Z'))
  })
})
