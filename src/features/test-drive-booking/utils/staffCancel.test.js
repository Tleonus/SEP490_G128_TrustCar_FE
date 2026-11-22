import { describe, it, expect } from 'vitest'
import { isCancelReady, buildCancelBody } from './staffCancel'
import { STAFF_CANCEL_REASONS } from '../constants/testDriveConstants'

describe('STAFF_CANCEL_REASONS (AC-F23)', () => {
  it('có đủ 4 lựa chọn đúng mã và chữ của CONTEXT G2', () => {
    expect(STAFF_CANCEL_REASONS.map((r) => r.code)).toEqual([
      'CUSTOMER_WILL_NOT_COME', 'SHOWROOM_BUSY', 'CUSTOMER_CHANGED_MIND', 'OTHER',
    ])
    expect(STAFF_CANCEL_REASONS.map((r) => r.label)).toEqual([
      'Khách báo không đến', 'Showroom có việc đột xuất', 'Khách đổi ý', 'Khác (phải ghi lý do)',
    ])
  })
})

describe('isCancelReady', () => {
  it('chưa chọn lý do → khóa', () => {
    expect(isCancelReady({})).toBe(false)
    expect(isCancelReady({ code: '', note: 'x' })).toBe(false)
    expect(isCancelReady(undefined)).toBe(false)
  })

  it('mã lạ → khóa', () => {
    expect(isCancelReady({ code: 'WHATEVER', note: 'x' })).toBe(false)
  })

  it('ba lý do có sẵn → mở, ghi chú không bắt buộc', () => {
    expect(isCancelReady({ code: 'CUSTOMER_WILL_NOT_COME' })).toBe(true)
    expect(isCancelReady({ code: 'SHOWROOM_BUSY', note: '' })).toBe(true)
    expect(isCancelReady({ code: 'CUSTOMER_CHANGED_MIND', note: 'đổi sang xe khác' })).toBe(true)
  })

  it('"Khác" thiếu ghi chú (rỗng hoặc chỉ khoảng trắng) → khóa; có ghi chú → mở', () => {
    expect(isCancelReady({ code: 'OTHER' })).toBe(false)
    expect(isCancelReady({ code: 'OTHER', note: '   ' })).toBe(false)
    expect(isCancelReady({ code: 'OTHER', note: 'xe hỏng' })).toBe(true)
  })

  it('ghi chú đúng 300 ký tự → mở; 301 → khóa (không tính khoảng trắng đầu cuối)', () => {
    expect(isCancelReady({ code: 'SHOWROOM_BUSY', note: 'a'.repeat(300) })).toBe(true)
    expect(isCancelReady({ code: 'SHOWROOM_BUSY', note: 'a'.repeat(301) })).toBe(false)
    expect(isCancelReady({ code: 'SHOWROOM_BUSY', note: ` ${'a'.repeat(300)} ` })).toBe(true)
  })
})

describe('buildCancelBody', () => {
  it('gửi status, reasonCode và reason đã cắt khoảng trắng', () => {
    expect(buildCancelBody({ code: 'OTHER', note: '  xe hỏng  ' })).toEqual({
      status: 'CANCELLED', reasonCode: 'OTHER', reason: 'xe hỏng',
    })
  })

  it('ghi chú rỗng → không có khóa reason', () => {
    expect(buildCancelBody({ code: 'SHOWROOM_BUSY', note: '   ' })).toEqual({ status: 'CANCELLED', reasonCode: 'SHOWROOM_BUSY' })
    expect(buildCancelBody({ code: 'SHOWROOM_BUSY' })).not.toHaveProperty('reason')
  })
})
