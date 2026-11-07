import { PAYMENT_METHOD, PAYMENT_METHOD_LABEL, SELLABLE_CAR_STATUSES } from '../constants/salesCrmConstants'
import { CAR_STATUS_LABEL, labelOf } from '../../../utils/constants'

// Kiểm tra dữ liệu chốt đơn phía FE (KAN-18). BE vẫn phải kiểm tra lại toàn bộ.

const PHONE_PATTERN = /^0[3-9]\d{8}$/ // Khớp Customer.phone của BE sau khi chuẩn hoá (GBR-16)
const ID_NUMBER_PATTERN = /^(\d{9}|\d{12})$/ // CMND 9 số hoặc CCCD 12 số
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const CONTRACT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-/.]{3,29}$/
const STATUS_REASON_MAX = 500 // Joi statusUpdateSchema.reason.max(500)

/** Ngày theo giờ máy, dạng YYYY-MM-DD (không dùng toISOString để tránh lệch múi giờ). */
export function toLocalISODate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Bỏ khoảng trắng, dấu chấm, gạch; đổi +84/84 thành 0. */
export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/[\s.\-()]/g, '')
  if (digits.startsWith('+84')) return `0${digits.slice(3)}`
  if (/^84\d{9}$/.test(digits)) return `0${digits.slice(2)}`
  return digits
}

export function normalizeIdNumber(value) {
  return String(value ?? '').replace(/\s/g, '')
}

export function createEmptyCheckoutValues(today = toLocalISODate()) {
  return {
    customerId: null,
    customerName: '',
    phone: '',
    idNumber: '',
    email: '',
    carId: null,
    paymentMethod: PAYMENT_METHOD.FULL,
    bankName: null,
    loanAmount: null,
    depositAmount: null,
    finalPrice: null,
    handoverDate: today,
    contractNumber: '',
    note: '',
    contractConfirmed: false,
  }
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * @param {ReturnType<typeof createEmptyCheckoutValues>} values
 * @param {import('../data/salesCrmMappers').CarVM|null} car  Xe đang được chọn (trạng thái mới nhất).
 * @param {{ today?: string }} [options]
 * @returns {Record<string, string>} Thông báo lỗi theo tên trường; rỗng nếu hợp lệ.
 */
export function validateCheckout(values, car, { today = toLocalISODate() } = {}) {
  const errors = {}
  const name = values.customerName.trim()
  const phone = normalizePhone(values.phone)
  const idNumber = normalizeIdNumber(values.idNumber)
  const email = values.email.trim()
  const isReserved = car?.status === 'RESERVED'
  const deposit = isReserved ? values.depositAmount : 0

  if (!name) errors.customerName = 'Vui lòng nhập họ tên khách hàng.'
  else if (name.length < 2 || name.length > 150) errors.customerName = 'Họ tên phải từ 2 đến 150 ký tự.'

  if (!phone) errors.phone = 'Vui lòng nhập số điện thoại.'
  else if (!PHONE_PATTERN.test(phone)) errors.phone = 'Số điện thoại không hợp lệ (10 số, ví dụ 0901234567).'

  if (!idNumber) errors.idNumber = 'Vui lòng nhập số CCCD/CMND.'
  else if (!ID_NUMBER_PATTERN.test(idNumber)) errors.idNumber = 'CCCD gồm 12 chữ số, CMND gồm 9 chữ số.'

  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Email không hợp lệ.'

  if (!car) errors.carId = 'Vui lòng chọn xe cần chốt đơn.'
  else if (!SELLABLE_CAR_STATUSES.includes(car.status)) {
    errors.carId = `Xe đang ở trạng thái "${labelOf(CAR_STATUS_LABEL, car.status)}". Chỉ chốt đơn được xe Đang bán hoặc Đã đặt cọc.`
  }

  if (values.finalPrice == null) errors.finalPrice = 'Vui lòng nhập giá chốt thực tế.'
  else if (!isPositiveNumber(values.finalPrice)) errors.finalPrice = 'Giá chốt phải lớn hơn 0.'

  if (isReserved) {
    if (values.depositAmount == null) errors.depositAmount = 'Xe đã đặt cọc, vui lòng nhập số tiền cọc đã nhận.'
    else if (!isPositiveNumber(values.depositAmount)) errors.depositAmount = 'Tiền cọc phải lớn hơn 0.'
    else if (isPositiveNumber(values.finalPrice) && values.depositAmount >= values.finalPrice) {
      errors.depositAmount = 'Tiền cọc phải nhỏ hơn giá chốt.'
    }
  }

  if (!Object.values(PAYMENT_METHOD).includes(values.paymentMethod)) {
    errors.paymentMethod = 'Vui lòng chọn phương thức thanh toán.'
  } else if (values.paymentMethod === PAYMENT_METHOD.INSTALLMENT) {
    if (!values.bankName) errors.bankName = 'Vui lòng chọn ngân hàng cho vay.'
    const remaining = isPositiveNumber(values.finalPrice) ? values.finalPrice - (deposit || 0) : null
    if (values.loanAmount == null) errors.loanAmount = 'Vui lòng nhập số tiền vay.'
    else if (!isPositiveNumber(values.loanAmount)) errors.loanAmount = 'Số tiền vay phải lớn hơn 0.'
    else if (remaining != null && values.loanAmount > remaining) {
      errors.loanAmount = 'Số tiền vay không được vượt quá số tiền còn phải thanh toán.'
    }
  }

  if (!values.handoverDate) errors.handoverDate = 'Vui lòng chọn ngày bàn giao xe.'
  else if (values.handoverDate < today) errors.handoverDate = 'Ngày bàn giao không được trước ngày chốt đơn.'

  const contract = values.contractNumber.trim()
  if (!contract) errors.contractNumber = 'Vui lòng nhập số hợp đồng mua bán.'
  else if (!CONTRACT_PATTERN.test(contract)) {
    errors.contractNumber = 'Số hợp đồng gồm 4–30 ký tự: chữ, số và - / .'
  }

  if (!values.contractConfirmed) {
    errors.contractConfirmed = 'Cần xác nhận khách đã ký hợp đồng và đã đối chiếu CCCD/CMND bản gốc.'
  }

  return errors
}

/** Số liệu cho khung tóm tắt đơn hàng. */
export function computeCheckoutSummary(values, car) {
  const finalPrice = isPositiveNumber(values.finalPrice) ? values.finalPrice : 0
  const deposit = car?.status === 'RESERVED' && isPositiveNumber(values.depositAmount) ? values.depositAmount : 0
  const remaining = Math.max(finalPrice - deposit, 0)
  const loan = values.paymentMethod === PAYMENT_METHOD.INSTALLMENT && isPositiveNumber(values.loanAmount)
    ? Math.min(values.loanAmount, remaining)
    : 0
  const listedPrice = car?.price ?? null
  return {
    listedPrice,
    finalPrice,
    priceDifference: listedPrice != null && finalPrice > 0 ? finalPrice - listedPrice : null,
    deposit,
    remaining,
    loan,
    customerPays: remaining - loan,
  }
}

/**
 * Payload gửi POST /orders/checkout (bám ERD Sale Record: customer, lead, xe, giá chốt, ngày bán, ngày bàn giao).
 * @param {{ car: import('../data/salesCrmMappers').CarVM, leadId?: string|null, appointmentId?: string|null, today?: string }} context
 */
export function buildCheckoutPayload(values, { car, leadId = null, appointmentId = null, today = toLocalISODate() }) {
  const isInstallment = values.paymentMethod === PAYMENT_METHOD.INSTALLMENT
  const email = values.email.trim()
  const note = values.note.trim()
  return {
    carId: car.id,
    vehicleCode: car.vehicleCode,
    expectedCarStatus: car.status,
    leadId,
    appointmentId,
    customer: {
      customerId: values.customerId ?? null,
      fullName: values.customerName.trim(),
      phone: normalizePhone(values.phone),
      idNumber: normalizeIdNumber(values.idNumber),
      email: email ? email.toLowerCase() : null,
    },
    saleDate: today,
    finalPrice: values.finalPrice,
    handoverDate: values.handoverDate,
    payment: {
      method: values.paymentMethod,
      depositAmount: car.status === 'RESERVED' ? values.depositAmount : 0,
      bankName: isInstallment ? values.bankName : null,
      loanAmount: isInstallment ? values.loanAmount : null,
    },
    contractNumber: values.contractNumber.trim().toUpperCase(),
    note: note || null,
  }
}

const vndFormatter = new Intl.NumberFormat('vi-VN')

/**
 * Lý do ghi vào ActivityLog khi đổi trạng thái xe (chế độ dự phòng). Không chứa CCCD/CMND để tránh lưu
 * dữ liệu định danh vào nhật ký hệ thống.
 */
export function buildStatusReason(payload) {
  const parts = [
    `Chốt đơn HĐ ${payload.contractNumber}`,
    `KH ${payload.customer.fullName} (${payload.customer.phone})`,
    `Giá chốt ${vndFormatter.format(payload.finalPrice)} đ`,
    PAYMENT_METHOD_LABEL[payload.payment.method],
  ]
  if (payload.payment.bankName) parts.push(`NH ${payload.payment.bankName}`)
  parts.push(`Bàn giao ${payload.handoverDate}`)
  const reason = parts.join(' · ')
  return reason.length > STATUS_REASON_MAX ? `${reason.slice(0, STATUS_REASON_MAX - 1)}…` : reason
}
