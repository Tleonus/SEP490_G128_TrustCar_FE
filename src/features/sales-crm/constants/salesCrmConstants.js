// Hằng số cho màn Quản lý bán hàng (KAN-18).
// Giá trị enum khớp backend (TrustCar-BE-Develop/src/constants/appConstants.js):
//  - LeadStage: NEW, CONTACTED, QUALIFIED, NEGOTIATING, WON, LOST
//  - AppointmentType: TEST_DRIVE, VIEWING, MAINTENANCE · AppointmentStatus: ... COMPLETED ...
//  - CarStatus: AVAILABLE (Đang bán), RESERVED (Đã đặt cọc = "Deposited" trong đặc tả), SOLD, ...

/**
 * Giai đoạn hiển thị trên pipeline. BE không có stage "Đã lái thử": FE suy ra TEST_DRIVEN từ lead ở
 * stage QUALIFIED, hoặc lead NEW/CONTACTED đã có lịch lái thử hoàn thành (xem getPipelineStage).
 */
export const PIPELINE_STAGE = Object.freeze({
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  TEST_DRIVEN: 'TEST_DRIVEN',
  NEGOTIATING: 'NEGOTIATING',
  WON: 'WON',
  LOST: 'LOST',
})

export const PIPELINE_STAGE_LABEL = {
  NEW: 'Mới tiếp nhận',
  CONTACTED: 'Đã liên hệ',
  TEST_DRIVEN: 'Đã lái thử',
  NEGOTIATING: 'Đang thương lượng',
  WON: 'Đã chốt đơn',
  LOST: 'Không thành công',
}

export const PIPELINE_STAGE_COLOR = {
  NEW: 'default',
  CONTACTED: 'blue',
  TEST_DRIVEN: 'cyan',
  NEGOTIATING: 'orange',
  WON: 'green',
  LOST: 'red',
}

/** 4 giai đoạn chính theo đặc tả KAN-18, hiển thị thành thẻ thống kê có thể bấm để lọc. */
export const PIPELINE_SUMMARY_STAGES = ['CONTACTED', 'TEST_DRIVEN', 'NEGOTIATING', 'WON']

export const APPOINTMENT_TYPE_LABEL = {
  TEST_DRIVE: 'Lái thử',
  VIEWING: 'Xem xe',
  MAINTENANCE: 'Bảo dưỡng',
}

export const APPOINTMENT_TYPE_COLOR = {
  TEST_DRIVE: 'geekblue',
  VIEWING: 'purple',
  MAINTENANCE: 'default',
}

/** Chỉ xe Đang bán hoặc Đã đặt cọc mới được chốt đơn. */
export const SELLABLE_CAR_STATUSES = ['AVAILABLE', 'RESERVED']

export const PAYMENT_METHOD = Object.freeze({
  FULL: 'FULL',
  INSTALLMENT: 'INSTALLMENT',
})

export const PAYMENT_METHOD_LABEL = {
  FULL: 'Trả thẳng 100%',
  INSTALLMENT: 'Trả góp qua ngân hàng',
}

export const LENDING_BANKS = [
  'Vietcombank',
  'VietinBank',
  'BIDV',
  'Agribank',
  'Techcombank',
  'VPBank',
  'MB Bank',
  'ACB',
  'TPBank',
  'Sacombank',
  'HDBank',
  'Shinhan Bank',
]

export const SALES_TABS = Object.freeze({
  LEADS: 'leads',
  APPOINTMENTS: 'appointments',
})

export const SALES_PAGE_SIZE = 10

/** Giá trị Select "khách hàng mới" trong modal chốt đơn. */
export const NEW_CUSTOMER_OPTION = '__new__'

/**
 * Token antd cho màn bán hàng. colorInfo gốc (ConfigProvider ở App.jsx) là navy của site công khai,
 * khiến Alert "info" thành nền xám đậm trong khu quản trị; dùng xanh --blue của AdminLayout.
 */
export const SALES_THEME = { token: { colorInfo: '#1d4ed8' } }
