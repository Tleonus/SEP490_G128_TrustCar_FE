/** Khớp TrustCar-BE-Develop/src/constants/depositConstants.js */
export const CAR_STATE = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  UNAVAILABLE: 'UNAVAILABLE',
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
  PENDING_PAYMENT: { label: 'Đang giữ xe · chờ chuyển cọc', color: 'gold' },
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
  RESERVED: { label: 'Đang được giữ chỗ', color: 'gold' },
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
