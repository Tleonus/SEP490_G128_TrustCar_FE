import { describe, expect, it } from 'vitest'
import {
  buildCheckoutPayload,
  buildStatusReason,
  computeCheckoutSummary,
  createEmptyCheckoutValues,
  normalizePhone,
  toLocalISODate,
  validateCheckout,
} from './checkoutValidation'

const TODAY = '2026-11-07'
const availableCar = { id: 'car-1', vehicleCode: 'TC-2026-0029', title: 'KIA Sonet Premium', licensePlate: '51K-123.45', price: 555000000, status: 'AVAILABLE' }
const reservedCar = { ...availableCar, status: 'RESERVED' }

function validValues(overrides = {}) {
  return {
    ...createEmptyCheckoutValues(TODAY),
    customerName: 'Nguyễn Minh Anh',
    phone: '0903 123 456',
    idNumber: '079201001234',
    carId: 'car-1',
    finalPrice: 540000000,
    handoverDate: '2026-11-10',
    contractNumber: 'hdmb-2026-0001',
    contractConfirmed: true,
    ...overrides,
  }
}

describe('normalizePhone', () => {
  it('bỏ khoảng trắng, dấu chấm và đổi +84/84 thành 0', () => {
    expect(normalizePhone('0903 123 456')).toBe('0903123456')
    expect(normalizePhone('+84903123456')).toBe('0903123456')
    expect(normalizePhone('84903123456')).toBe('0903123456')
    expect(normalizePhone('0903.123.456')).toBe('0903123456')
  })
})

describe('toLocalISODate', () => {
  it('định dạng YYYY-MM-DD theo giờ máy', () => {
    expect(toLocalISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('validateCheckout', () => {
  it('hợp lệ với xe Đang bán và thanh toán trả thẳng', () => {
    expect(validateCheckout(validValues(), availableCar, { today: TODAY })).toEqual({})
  })

  it('bắt buộc họ tên, SĐT, CCCD, số hợp đồng và xác nhận hợp đồng', () => {
    const errors = validateCheckout(
      validValues({ customerName: ' ', phone: '', idNumber: '', contractNumber: '', contractConfirmed: false }),
      availableCar,
      { today: TODAY },
    )
    expect(Object.keys(errors).sort()).toEqual(['contractConfirmed', 'contractNumber', 'customerName', 'idNumber', 'phone'])
  })

  it('từ chối SĐT, CCCD/CMND sai định dạng', () => {
    const errors = validateCheckout(validValues({ phone: '0123456789', idNumber: '12345' }), availableCar, { today: TODAY })
    expect(errors.phone).toBeTruthy()
    expect(errors.idNumber).toBeTruthy()
    expect(validateCheckout(validValues({ idNumber: '123456789' }), availableCar, { today: TODAY }).idNumber).toBeUndefined()
  })

  it('chặn xe không ở trạng thái Đang bán hoặc Đã đặt cọc', () => {
    for (const status of ['SOLD', 'INCOMING', 'MAINTENANCE', 'DELISTED']) {
      const errors = validateCheckout(validValues(), { ...availableCar, status }, { today: TODAY })
      expect(errors.carId).toMatch(/Chỉ chốt đơn được xe/)
    }
    expect(validateCheckout(validValues(), null, { today: TODAY }).carId).toBeTruthy()
  })

  it('xe Đã đặt cọc bắt buộc tiền cọc > 0 và nhỏ hơn giá chốt', () => {
    expect(validateCheckout(validValues(), reservedCar, { today: TODAY }).depositAmount).toBeTruthy()
    expect(validateCheckout(validValues({ depositAmount: 600000000 }), reservedCar, { today: TODAY }).depositAmount).toBeTruthy()
    expect(validateCheckout(validValues({ depositAmount: 50000000 }), reservedCar, { today: TODAY })).toEqual({})
  })

  it('không yêu cầu tiền cọc với xe Đang bán', () => {
    expect(validateCheckout(validValues({ depositAmount: null }), availableCar, { today: TODAY }).depositAmount).toBeUndefined()
  })

  it('trả góp bắt buộc ngân hàng và số tiền vay không vượt số còn phải trả', () => {
    const base = { paymentMethod: 'INSTALLMENT' }
    const missing = validateCheckout(validValues(base), availableCar, { today: TODAY })
    expect(missing.bankName).toBeTruthy()
    expect(missing.loanAmount).toBeTruthy()
    const tooMuch = validateCheckout(
      validValues({ ...base, bankName: 'BIDV', loanAmount: 500000000, depositAmount: 50000000 }),
      reservedCar,
      { today: TODAY },
    )
    expect(tooMuch.loanAmount).toMatch(/vượt quá/)
    expect(validateCheckout(validValues({ ...base, bankName: 'BIDV', loanAmount: 300000000 }), availableCar, { today: TODAY })).toEqual({})
  })

  it('ngày bàn giao không được trước ngày chốt đơn', () => {
    expect(validateCheckout(validValues({ handoverDate: '2026-11-06' }), availableCar, { today: TODAY }).handoverDate).toBeTruthy()
    expect(validateCheckout(validValues({ handoverDate: TODAY }), availableCar, { today: TODAY }).handoverDate).toBeUndefined()
  })

  it('giá chốt phải lớn hơn 0', () => {
    expect(validateCheckout(validValues({ finalPrice: 0 }), availableCar, { today: TODAY }).finalPrice).toBeTruthy()
    expect(validateCheckout(validValues({ finalPrice: null }), availableCar, { today: TODAY }).finalPrice).toBeTruthy()
  })
})

describe('computeCheckoutSummary', () => {
  it('tính còn phải trả, vay ngân hàng và khách trả trực tiếp', () => {
    const summary = computeCheckoutSummary(
      validValues({ depositAmount: 50000000, paymentMethod: 'INSTALLMENT', loanAmount: 300000000 }),
      reservedCar,
    )
    expect(summary).toMatchObject({
      listedPrice: 555000000,
      finalPrice: 540000000,
      priceDifference: -15000000,
      deposit: 50000000,
      remaining: 490000000,
      loan: 300000000,
      customerPays: 190000000,
    })
  })

  it('bỏ qua tiền cọc khi xe Đang bán', () => {
    expect(computeCheckoutSummary(validValues({ depositAmount: 50000000 }), availableCar).deposit).toBe(0)
  })
})

describe('buildCheckoutPayload / buildStatusReason', () => {
  it('chuẩn hoá dữ liệu gửi đi', () => {
    const payload = buildCheckoutPayload(validValues({ email: ' A@Example.com ' }), { car: availableCar, leadId: 'lead-1', today: TODAY })
    expect(payload).toMatchObject({
      carId: 'car-1',
      vehicleCode: 'TC-2026-0029',
      leadId: 'lead-1',
      appointmentId: null,
      saleDate: TODAY,
      finalPrice: 540000000,
      contractNumber: 'HDMB-2026-0001',
      customer: { phone: '0903123456', idNumber: '079201001234', email: 'a@example.com' },
      payment: { method: 'FULL', depositAmount: 0, bankName: null, loanAmount: null },
    })
  })

  it('lý do đổi trạng thái không chứa CCCD và tối đa 500 ký tự', () => {
    const payload = buildCheckoutPayload(validValues({ customerName: 'A'.repeat(150), contractNumber: 'X'.repeat(30) }), { car: availableCar, today: TODAY })
    const reason = buildStatusReason(payload)
    expect(reason).not.toContain('079201001234')
    expect(reason.length).toBeLessThanOrEqual(500)
    expect(reason).toContain('Chốt đơn HĐ')
  })
})
