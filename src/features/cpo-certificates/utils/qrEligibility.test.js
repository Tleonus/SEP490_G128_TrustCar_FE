import { describe, it, expect } from 'vitest'
import { buildQrFileName, getQrEligibility } from './qrEligibility'

describe('getQrEligibility', () => {
  it.each(['APPROVED_CPO', 'AVAILABLE'])('cho phép tạo QR khi xe %s', (status) => {
    expect(getQrEligibility(status)).toEqual({ eligible: true, reason: null })
  })

  it.each(['RESERVED', 'SOLD', 'DELISTED', 'UNDER_INSPECTION', undefined])('khoá QR và nêu lý do khi xe %s', (status) => {
    const result = getQrEligibility(status)
    expect(result.eligible).toBe(false)
    expect(result.reason).toMatch(/không còn báo cáo công khai/)
  })

  it('lý do nêu tên trạng thái tiếng Việt', () => {
    expect(getQrEligibility('SOLD').reason).toContain('Đã bán')
  })
})

describe('buildQrFileName', () => {
  it('đặt tên theo mã CPO', () => {
    expect(buildQrFileName('CPO-20261103-0001', 'png')).toBe('CPO-20261103-0001.png')
    expect(buildQrFileName('CPO-20261103-0001', 'svg')).toBe('CPO-20261103-0001.svg')
  })

  it('bỏ ký tự không an toàn cho tên file', () => {
    expect(buildQrFileName('../CPO 2026/0001', 'png')).toBe('CPO20260001.png')
  })

  it('có tên dự phòng khi thiếu mã', () => {
    expect(buildQrFileName('', 'svg')).toBe('trustcar-qr.svg')
  })
})
