import { describe, expect, it } from 'vitest'
import { FALLBACK_CONFIG, formatUpdatedAt, normalizeLoanSettings, termLabel, termOptions } from './loanConfig'

const bank = (extra) => ({
  id: 'A', name: 'A', isPartner: false, active: true, promoRate: 9,
  note: '', cars: '', sourceUrl: '', sourceDate: '', ...extra,
})

describe('normalizeLoanSettings', () => {
  it('không có dữ liệu → cấu hình dự phòng (TPBank liên kết, 30 %, 12–84 tháng)', () => {
    const config = normalizeLoanSettings(null)
    expect(config.partner.id).toBe('TPBANK')
    expect(config.downMin).toBe(30)
    expect(config.terms).toEqual([12, 24, 36, 48, 60, 72, 84])
    expect(config).toEqual(FALLBACK_CONFIG)
  })

  it('bỏ ngân hàng ẩn; ngân hàng liên kết đứng đầu, còn lại theo lãi tăng dần', () => {
    const config = normalizeLoanSettings({
      minDownPaymentPct: 20, minTermMonths: 12, maxTermMonths: 36, updatedAt: '2026-11-27T03:00:00.000Z',
      banks: [bank({ id: 'C', promoRate: 10 }), bank({ id: 'P', isPartner: true, promoRate: 9.5 }), bank({ id: 'B', promoRate: 8 }), bank({ id: 'H', active: false })],
    })
    expect(config.banks.map((item) => item.id)).toEqual(['P', 'B', 'C'])
    expect(config.downMin).toBe(20)
    expect(config.terms).toEqual([12, 24, 36])
    expect(formatUpdatedAt(config.updatedAt)).toBe('27/11/2026')
  })

  it('không có ngân hàng liên kết đang hiện → dùng danh sách dự phòng (trang không hỏng)', () => {
    expect(normalizeLoanSettings({ banks: [bank({ isPartner: true, active: false })] }).partner.id).toBe('TPBANK')
  })

  it('giữ điều kiện vay; bỏ link không phải http(s) và các trường cũ (số tháng ưu đãi, lãi sau ưu đãi)', () => {
    const config = normalizeLoanSettings({
      banks: [bank({ isPartner: true, promoMonths: 12, floatingRate: 12, baseRate: 11, margin: 1, maxLoanPct: 80, minLoanAmount: 300_000_000, minTermMonths: 48, maxTermMonths: 60, sourceUrl: 'javascript:alert(1)' })],
    })
    expect(config.partner).toMatchObject({ maxLoanPct: 80, minLoanAmount: 300_000_000, minTermMonths: 48, maxTermMonths: 60, sourceUrl: '' })
    expect(config.partner).not.toHaveProperty('promoMonths')
    expect(config.partner).not.toHaveProperty('floatingRate')
    expect(config.partner).not.toHaveProperty('baseRate')
    expect(config.partner).not.toHaveProperty('margin')
  })

  it('cấu hình dự phòng: MSB (lãi thấp hơn ngân hàng liên kết) đang ẩn', () => {
    expect(FALLBACK_CONFIG.banks.map((item) => item.id)).toEqual(['TPBANK', 'PVCOMBANK', 'HLBANK'])
    expect(FALLBACK_CONFIG.banks.find((item) => item.id === 'HLBANK')).toMatchObject({ promoRate: 10.59 })
  })
})

describe('termOptions', () => {
  it('bội số 12 trong khoảng; tối đa 120; không có bội số → [max]', () => {
    expect(termOptions(24, 60)).toEqual([24, 36, 48, 60])
    expect(termOptions(12, 360)).toHaveLength(10)
    expect(termOptions(13, 20)).toEqual([20])
  })
})

describe('các lựa chọn của khách (admin đặt)', () => {
  const partner = { id: 'P', name: 'P', isPartner: true, active: true, promoRate: 9 }

  it('dùng danh sách thời hạn / mức trả trước đã lưu; bỏ số sai và mức thấp hơn tối thiểu', () => {
    const config = normalizeLoanSettings({
      minDownPaymentPct: 30, termOptions: [36, 18, 18, 0, 200], downPaymentOptions: [20, 45, 30], banks: [partner],
    })
    expect(config.terms).toEqual([18, 36])
    expect(config.downOptions).toEqual([30, 45])
  })

  it('bản lưu cũ chưa có danh sách → thời hạn theo khoảng, mức trả trước mặc định', () => {
    const config = normalizeLoanSettings({ minDownPaymentPct: 35, minTermMonths: 24, maxTermMonths: 48, banks: [partner] })
    expect(config.terms).toEqual([24, 36, 48])
    expect(config.downOptions).toEqual([35, 40, 50, 70])
  })

  it('termLabel: tròn năm ghi thêm số năm', () => {
    expect(termLabel(24)).toBe('24 tháng (2 năm)')
    expect(termLabel(18)).toBe('18 tháng')
  })
})
