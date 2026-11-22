/**
 * KAN-45 – Hằng số cho timeline lịch sử giá xe.
 *
 * Mã lý do lấy đúng theo những gì Backend đang ghi vào Car.priceHistory:
 *  - services/carService.js tạo xe      → 'Initial intake price'
 *  - services/carService.js đổi giá     → reason do người dùng nhập (priceChangeReason), có thể null
 *  - services/inventoryService.js       → `AUTO_MARKDOWN_${agingStatus}`, agingStatus ∈ FRESH | AGING | CRITICAL
 *  - seeders/carSeeder.js               → 'Initial intake price', 'Customer negotiation - price reduced'
 *
 * Lý do do người dùng tự nhập thì giữ nguyên chữ, không dịch — chỉ dịch các mã đã biết.
 */

/** Nhãn tiếng Việt cho các lý do Backend tự sinh. Khoá so khớp không phân biệt hoa thường. */
export const REASON_LABELS = {
  'initial intake price': 'Giá nhập kho ban đầu',
  'customer negotiation - price reduced': 'Khách thương lượng — giảm giá',
  'auto_markdown_fresh': 'Tự động giảm giá (xe mới về kho)',
  'auto_markdown_aging': 'Tự động giảm giá do tồn kho 30–60 ngày',
  'auto_markdown_critical': 'Tự động giảm giá do tồn kho lâu',
}

/** Lý do khi trường reason rỗng. */
export const NO_REASON_LABEL = 'Không ghi lý do'

/** Lý do của mốc đầu tiên khi Backend không lưu reason. */
export const INITIAL_PRICE_LABEL = 'Giá nhập kho ban đầu'

/** Xe chưa có lịch sử giá. */
export const EMPTY_TEXT = 'Xe này chưa có lịch sử thay đổi giá.'

/** Màu của chấm timeline theo hướng thay đổi. */
export const TREND_COLOR = {
  up: 'green',
  down: 'red',
  same: 'gray',
  initial: 'blue',
}
