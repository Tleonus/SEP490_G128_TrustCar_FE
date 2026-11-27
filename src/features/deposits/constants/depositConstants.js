/** Khớp TrustCar-BE-Develop/src/constants/depositConstants.js */
export const CAR_STATE = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  UNAVAILABLE: 'UNAVAILABLE',
})

/** KAN-99: cổng thanh toán tiền cọc. MANUAL = sale xác nhận chuyển khoản tay (flow cũ). */
export const PAYMENT_PROVIDER = Object.freeze({
  MANUAL: 'MANUAL',
  VNPAY:  'VNPAY',
})

export const PAYMENT_PROVIDER_META = Object.freeze({
  MANUAL: {
    label: 'Chuyển khoản / Thanh toán tại showroom',
    hint:  'Sale sẽ xác nhận trong 24 giờ sau khi nhận tiền chuyển khoản hoặc tiền mặt.',
    recommended: false,
  },
  VNPAY: {
    label: 'VNPay (ATM / QR / thẻ quốc tế)',
    hint:  'Thanh toán online qua cổng VNPay sandbox, cập nhật trạng thái tức thì.',
    recommended: true,
  },
})

/**
 * KAN-99: mã trả về của VNPay ở query string returnUrl.
 * Ref: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
export const VNPAY_RESPONSE_CODE = Object.freeze({
  SUCCESS:          '00',
  SUSPICIOUS_FRAUD: '07',
  CUSTOMER_CANCEL:  '24',
  OTP_WRONG:        '75',
  OTP_LIMIT:        '79',
  BAD_SIGNATURE:    '97',
})

export const VNPAY_MESSAGE_BY_CODE = Object.freeze({
  '00': 'Thanh toán thành công.',
  '07': 'Giao dịch bị nghi ngờ gian lận, VNPay đã tạm giữ để xác minh.',
  '09': 'Thẻ/Tài khoản chưa đăng ký Internet Banking tại ngân hàng.',
  '10': 'Xác thực thẻ/Tài khoản không đúng quá 3 lần.',
  '11': 'Hết hạn chờ thanh toán. Vui lòng thực hiện lại.',
  '12': 'Thẻ/Tài khoản bị khóa.',
  '24': 'Bạn đã hủy giao dịch tại trang VNPay.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng đang bảo trì.',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần cho phép.',
  '97': 'Chữ ký không hợp lệ.',
  '99': 'Lỗi không xác định. Vui lòng thử lại.',
})

/** Trạng thái lượt giữ xe. */
export const DEPOSIT_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  DEPOSIT_PAID: 'DEPOSIT_PAID',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
})

/** Trạng thái tiền – tách riêng với trạng thái giữ xe. */
export const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'UNPAID',
  DEPOSIT_PAID: 'DEPOSIT_PAID',
  FULLY_PAID: 'FULLY_PAID',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED',
})

export const ACTIVE_DEPOSIT_STATUSES = [DEPOSIT_STATUS.PENDING_PAYMENT, DEPOSIT_STATUS.DEPOSIT_PAID]

export const DEPOSIT_STATUS_META = {
  PENDING_PAYMENT: { label: 'Đang giữ xe · chờ chuyển cọc', color: 'blue' },
  DEPOSIT_PAID: { label: 'Đang giữ xe · đã nhận cọc', color: 'blue' },
  COMPLETED: { label: 'Hoàn tất mua xe', color: 'green' },
  EXPIRED: { label: 'Hết hạn giữ xe', color: 'default' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
}

export const PAYMENT_STATUS_META = {
  UNPAID: { label: 'Chưa thanh toán', color: 'default' },
  DEPOSIT_PAID: { label: 'Đã thanh toán cọc', color: 'blue' },
  FULLY_PAID: { label: 'Đã thanh toán đủ', color: 'green' },
  REFUND_PENDING: { label: 'Chờ hoàn cọc', color: 'orange' },
  REFUNDED: { label: 'Đã hoàn cọc', color: 'purple' },
}

export const CAR_STATE_META = {
  AVAILABLE: { label: 'Đang mở bán', color: 'green' },
  RESERVED: { label: 'Đang được giữ chỗ', color: 'blue' },
  SOLD: { label: 'Đã bán', color: 'red' },
  UNAVAILABLE: { label: 'Tạm ngưng bán', color: 'default' },
}

export const CUSTOMER_ROLE = 'CUSTOMER'
export const STAFF_ROLES = ['ADMIN', 'SALES_STAFF']

export const DEPOSIT_PATHS = {
  carDeposit: (carKey) => `/xe/${encodeURIComponent(carKey)}/dat-coc`,
  myDeposits: '/dat-coc-cua-toi',
  adminDeposits: '/admin/deposits',
}

/**
 * Chính sách hiển thị trong modal. Số tiền & số giờ lấy từ BE (policy).
 * NỘI DUNG CHÍNH SÁCH LÀ BẢN ĐỀ XUẤT – cần chủ nghiệp vụ duyệt.
 */
export function depositPolicyText(holdHours = 24) {
  return [
    `Xe được giữ riêng cho bạn trong ${holdHours} giờ kể từ lúc đặt cọc; trong thời gian này khách hàng khác không thể đặt cọc hoặc mua xe.`,
    'Chuyển khoản tiền cọc với nội dung là mã đặt cọc. Trạng thái "Đã thanh toán cọc" chỉ được cập nhật khi TrustCar xác thực đã nhận tiền.',
    `Bạn cần hoàn tất thanh toán đủ giá trị xe trong ${holdHours} giờ. Quá thời hạn, lượt giữ tự động hết hạn và xe được mở bán lại.`,
    'Tiền cọc được trừ vào giá trị xe khi thanh toán.',
  ]
}

export const REFUND_POLICY_TEXT = [
  'Chưa chuyển tiền cọc: bạn có thể tự hủy lượt giữ bất kỳ lúc nào, không mất phí.',
  'Đã chuyển tiền cọc nhưng lượt giữ kết thúc (hết hạn hoặc hủy): tiền cọc được xử lý hoàn theo hợp đồng đặt cọc.',
  'Hoàn 100% tiền cọc nếu xe không đúng tình trạng đã công bố hoặc TrustCar không thể bàn giao xe.',
  'Tiền hoàn trả về đúng tài khoản đã chuyển trong vòng 7 ngày làm việc.',
]
