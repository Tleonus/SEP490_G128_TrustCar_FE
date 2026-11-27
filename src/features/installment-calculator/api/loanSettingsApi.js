import api from '../../../services/api'

// Cấu hình tính trả góp (KAN-63): GET /settings/loan công khai, PUT chỉ ADMIN.
// Trang tính và khối ở trang chi tiết xe dùng chung một lần tải (bộ nhớ đệm trong phiên trang);
// admin lưu xong thì xoá bộ đệm để trang tính mở sau đó thấy số mới.

let cached = null

/** @returns {Promise<object>} `data` của GET /settings/loan. Lỗi → reject (bộ đệm bị xoá để lần sau thử lại). */
export function fetchLoanSettings() {
  if (!cached) {
    cached = api.get('/settings/loan')
      .then(({ data }) => data?.data ?? null)
      .catch((error) => { cached = null; throw error })
  }
  return cached
}

/** Đọc bản mới nhất, không qua bộ đệm (màn hình admin). */
export async function fetchLoanSettingsFresh() {
  const { data } = await api.get('/settings/loan')
  return data?.data ?? null
}

/**
 * Lưu cấu hình (ADMIN). Gửi danh sách ngân hàng → BE tự lấy lãi chatbot theo ngân hàng liên kết.
 * @param {{ minDownPaymentPct: number, minTermMonths: number, maxTermMonths: number, banks: object[] }} body
 */
export async function saveLoanSettings(body) {
  const { data } = await api.put('/settings/loan', body)
  cached = null
  return data?.data ?? null
}
