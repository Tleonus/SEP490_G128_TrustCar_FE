import { describe, expect, it } from 'vitest'
import { generalRules, makeBankId, newBankRow, sameForm, toForm, toPayload, validateForm } from './adminLoanForm'
import { VN_BANKS, findBanks } from './vnBanks'
import { FALLBACK_LOAN_SETTINGS } from '../constants/bankRates'

const form = () => toForm(FALLBACK_LOAN_SETTINGS)

describe('toForm / toPayload', () => {
  it('dữ liệu máy chủ → form → thân PUT giữ nguyên số (không có key của React)', () => {
    const payload = toPayload(form())
    expect(payload.minDownPaymentPct).toBe(30)
    expect(payload.banks).toHaveLength(4)
    expect(payload.banks[2]).toMatchObject({ id: 'PVCOMBANK', promoRate: 9.5 })
    expect(payload.banks[2]).not.toHaveProperty('floatingRate')
    expect(payload.banks[2]).not.toHaveProperty('promoMonths')
    expect(payload.banks[0].key).toBeUndefined()
  })

  it('ngân hàng mới chưa có mã → tạo mã từ tên, bỏ dấu, không trùng', () => {
    const next = form()
    next.banks.push({ ...newBankRow({ id: '', name: 'Ngân hàng Đông Á' }), promoRate: 10 })
    next.banks.push({ ...newBankRow({ id: '', name: 'MSB' }), promoRate: 11 })
    const ids = toPayload(next).banks.map((bank) => bank.id)
    expect(ids.slice(4)).toEqual(['NGANHANGDONGA', 'MSB2'])
    expect(makeBankId('', [])).toBe('BANK')
  })

  it('sameForm: chỉ khác key → giống nhau; sửa lãi → khác', () => {
    const a = form()
    const b = { ...a, banks: a.banks.map((bank) => ({ ...bank, key: `${bank.key}-x` })) }
    expect(sameForm(a, b)).toBe(true)
    b.banks[1] = { ...b.banks[1], promoRate: 9.1 }
    expect(sameForm(a, b)).toBe(false)
  })
})

describe('validateForm', () => {
  it('cấu hình mặc định hợp lệ', () => {
    expect(validateForm(form()).ok).toBe(true)
  })

  it('đúng 1 ngân hàng liên kết, đang hiện', () => {
    const none = form()
    none.banks[0].isPartner = false
    expect(validateForm(none).list).toMatch(/đúng 1 ngân hàng liên kết/)
    const hidden = form()
    hidden.banks[0].active = false
    expect(validateForm(hidden).list).toMatch(/phải đang hiện/)
  })

  it('lãi ưu đãi sai khoảng → báo lỗi đúng ô', () => {
    const bad = form()
    bad.banks[1] = { ...bad.banks[1], promoRate: 45 }
    expect(validateForm(bad).banks[1].promoRate).toMatch(/0 đến 40/)
  })

  it('tên trống, link không phải web, trả trước > 90 %', () => {
    const next = form()
    next.banks[1] = { ...next.banks[1], name: ' ', sourceUrl: 'ftp://x' }
    next.minDownPaymentPct = 95
    const check = validateForm(next)
    expect(check.ok).toBe(false)
    expect(check.banks[1].name).toBeTruthy()
    expect(check.banks[1].sourceUrl).toMatch(/http/)
    expect(check.general.minDownPaymentPct).toMatch(/0 đến 90/)
  })

  it('các lựa chọn của khách: không được trống; mức trả trước thấp hơn mức tối thiểu → lỗi', () => {
    expect(validateForm({ ...form(), termOptions: [] }).general.termOptions).toMatch(/ít nhất 1 thời hạn/)
    expect(validateForm({ ...form(), downPaymentOptions: [] }).general.downPaymentOptions).toMatch(/ít nhất 1 mức/)
    expect(validateForm({ ...form(), downPaymentOptions: [20, 40] }).general.downPaymentOptions).toMatch(/Mức 20% thấp hơn trả trước tối thiểu 30%/)
  })

  it('không có ngân hàng nào → lỗi danh sách', () => {
    expect(validateForm({ ...form(), banks: [] }).list).toMatch(/ít nhất 1/)
  })
})

describe('các lựa chọn và quy định chung', () => {
  it('toForm: lấy danh sách đã lưu; bản lưu cũ (chưa có danh sách) → suy ra từ thời hạn ngắn/dài nhất', () => {
    expect(form().termOptions).toEqual([12, 24, 36, 48, 60, 72, 84])
    expect(form().downPaymentOptions).toEqual([30, 40, 50, 70])
    const old = toForm({ minDownPaymentPct: 35, minTermMonths: 24, maxTermMonths: 60, banks: [] })
    expect(old.termOptions).toEqual([24, 36, 48, 60])
    expect(old.downPaymentOptions).toEqual([35, 40, 50, 70])
  })

  it('toPayload gửi danh sách tăng dần, không gửi thời hạn ngắn/dài nhất (BE tự suy ra)', () => {
    const payload = toPayload({ ...form(), termOptions: [36, 18, 12], downPaymentOptions: [50, 30] })
    expect(payload.termOptions).toEqual([12, 18, 36])
    expect(payload.downPaymentOptions).toEqual([30, 50])
    expect(payload).not.toHaveProperty('minTermMonths')
  })

  it('generalRules: số khách thấy khi ô điều kiện của ngân hàng để trống', () => {
    expect(generalRules({ ...form(), termOptions: [18, 24, 60] })).toEqual({ maxLoanPct: 70, minTermMonths: 18, maxTermMonths: 60 })
  })

  it('ngân hàng mới lấy mã và tên từ danh sách ngân hàng Việt Nam', () => {
    const vcb = VN_BANKS.find((item) => item.id === 'VIETCOMBANK')
    expect(newBankRow(vcb)).toMatchObject({ id: 'VIETCOMBANK', name: 'Vietcombank', promoRate: null, active: true, isPartner: false })
  })
})

describe('danh sách ngân hàng Việt Nam', () => {
  it('có đủ các ngân hàng đang dùng, mã không trùng, đúng khuôn mã của BE', () => {
    const ids = VN_BANKS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    ;['TPBANK', 'MSB', 'PVCOMBANK', 'HLBANK'].forEach((id) => expect(ids).toContain(id))
    ids.forEach((id) => expect(id).toMatch(/^[A-Z0-9_-]{2,20}$/))
  })

  it('tìm không dấu theo tên, tên đầy đủ hoặc mã', () => {
    expect(findBanks('ngoai thuong').map((item) => item.id)).toContain('VIETCOMBANK')
    expect(findBanks('Á Châu').map((item) => item.id)).toEqual(['ACB'])
    expect(findBanks('tpb').map((item) => item.id)).toEqual(['TPBANK'])
    expect(findBanks('')).toHaveLength(VN_BANKS.length)
    expect(findBanks('khong co ngan hang nay')).toEqual([])
  })
})
