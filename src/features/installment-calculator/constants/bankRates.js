// Lãi suất vay mua ô tô DỰ PHÒNG: chỉ dùng khi chưa tải được cấu hình từ máy chủ (GET /settings/loan).
// Số thật do quản trị viên sửa ở màn hình "Lãi suất trả góp" (/admin/lai-suat-tra-gop).
// Đối chiếu trang web CHÍNH THỨC của từng ngân hàng ngày 27/11/2026, khớp mặc định của BE
// (src/config/loanSettings.js). null = ngân hàng không công bố số đó. Lãi thả nổi sau ưu đãi không lưu: ngân
// hàng không công bố trước được nên trang tính không dùng.
// Ref: .sdd/features/installment-calculator/SPEC.md (REQ-F13…F16)

/**
 * @typedef {object} Bank
 * @property {string} id
 * @property {string} name
 * @property {boolean} isPartner          Ngân hàng liên kết showroom (đúng 1).
 * @property {boolean} active             Hiện trên trang tính.
 * @property {number} promoRate           Lãi ưu đãi (%/năm).
 * @property {number|null} maxLoanPct     Cho vay tối đa (% giá xe).
 * @property {number|null} minLoanAmount  Số tiền vay tối thiểu (đồng).
 * @property {number|null} minTermMonths
 * @property {number|null} maxTermMonths
 * @property {string} note
 * @property {string} cars
 * @property {string} sourceUrl
 * @property {string} sourceDate
 */

const NO_CONDITIONS = { maxLoanPct: null, minLoanAmount: null, minTermMonths: null, maxTermMonths: null }

/** @type {Bank[]} */
const FALLBACK_BANKS = [
  {
    ...NO_CONDITIONS,
    id: 'TPBANK', name: 'TPBank', isPartner: true, active: true,
    promoRate: 8.2, maxTermMonths: 96,
    note: 'Có gói cố định 6–24 tháng (8,2–11,2%).',
    cars: 'Liên kết showroom',
    sourceUrl: 'https://tpb.vn/tin-tuc/tin-tpbank/tpbank-tung-chuoi-uu-dai-lai-suat-8000-ty-dong-danh-cho-khach-hang-doanh-nghiep-sme-va-khach-hang-ca-nhan',
    sourceDate: '26/08/2026',
  },
  {
    ...NO_CONDITIONS,
    id: 'MSB', name: 'MSB', isPartner: false, active: false,
    promoRate: 7.5, maxLoanPct: 70, maxTermMonths: 96,
    note: '',
    cars: 'Xe cũ: vay 70%, 8 năm',
    sourceUrl: 'https://www.msb.com.vn/ve-chung-toi/tin-tuc-va-su-kien/kien-thuc-xu-huong/vay-the-chap-o-to/',
    sourceDate: '19/11/2026',
  },
  {
    ...NO_CONDITIONS,
    id: 'PVCOMBANK', name: 'PVcomBank', isPartner: false, active: true,
    promoRate: 9.5, maxLoanPct: 80, maxTermMonths: 72,
    note: '',
    cars: 'Xe mới và xe cũ',
    sourceUrl: 'https://www.pvcombank.com.vn/san-pham/ca-nhan/san-pham-vay/vay-mua-o-to',
    sourceDate: 'Không ghi ngày',
  },
  {
    ...NO_CONDITIONS,
    id: 'HLBANK', name: 'Hong Leong Bank', isPartner: false, active: true,
    promoRate: 10.59,
    maxLoanPct: 80, minLoanAmount: 300_000_000, minTermMonths: 48, maxTermMonths: 60,
    note: 'Gói 2 năm; gói 1 năm: 9,99%.',
    cars: 'Chỉ xe mới',
    sourceUrl: 'https://www.hlbank.com.vn/vi/personal-banking/loan/auto-loan.html',
    sourceDate: '15/10/2026',
  },
]

/** Cấu hình dự phòng, cùng dạng với dữ liệu GET /settings/loan. */
export const FALLBACK_LOAN_SETTINGS = Object.freeze({
  minDownPaymentPct: 30,
  minTermMonths: 12,
  maxTermMonths: 84,
  termOptions: [12, 24, 36, 48, 60, 72, 84],
  downPaymentOptions: [30, 40, 50, 70],
  banks: FALLBACK_BANKS,
  updatedAt: null,
})

/** Định dạng % kiểu Việt Nam: 8.2 → "8,2". */
export const formatRate = (rate) => String(rate).replace('.', ',')

/** Thông số lãi của một ngân hàng cho ô nhập của trang tính: một mức lãi ưu đãi cho cả kỳ vay. */
export const bankRateFields = (bank) => ({ ratePercent: bank.promoRate })
