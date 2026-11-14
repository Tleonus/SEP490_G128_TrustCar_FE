import api from '../../../services/api'

/**
 * API của KAN-22 (Car Deposit & Online Hold). Dùng axios `api` có sẵn nên tự gắn Bearer token
 * và tự refresh khi 401. Envelope backend: { success, message, data, meta? }.
 */

/** GET /deposits/cars/:carKey/hold-status – công khai; nếu đã đăng nhập BE biết lượt giữ có phải của mình không. */
export async function fetchCarHoldStatus(carKey, signal) {
  const { data } = await api.get(`/deposits/cars/${encodeURIComponent(carKey)}/hold-status`, { signal })
  return data?.data
}

/**
 * POST /deposits – gửi carId + depositAmount (+ userId theo Jira; BE đối chiếu với JWT,
 * không dùng userId này làm danh tính).
 */
export async function createDeposit({ carId, depositAmount, userId }) {
  const body = { carId, depositAmount }
  if (userId) body.userId = userId
  const { data } = await api.post('/deposits', body)
  return data?.data
}

/** GET /deposits/me – lịch sử đặt cọc của khách. */
export async function fetchMyDeposits(params = {}) {
  const { data } = await api.get('/deposits/me', { params })
  return { items: data?.data ?? [], meta: data?.meta ?? null }
}

/** GET /deposits/:id */
export async function fetchDeposit(id) {
  const { data } = await api.get(`/deposits/${id}`)
  return data?.data
}

/** PATCH /deposits/:id/cancel */
export async function cancelDeposit(id, reason) {
  const { data } = await api.patch(`/deposits/${id}/cancel`, { reason: reason || undefined })
  return data?.data
}

/** GET /deposits – nhân viên (ADMIN, SALES_STAFF). */
export async function fetchDepositsForStaff(params = {}) {
  const { data } = await api.get('/deposits', { params })
  return { items: data?.data ?? [], meta: data?.meta ?? null }
}

const cleanPayment = ({ paymentReference, note } = {}) => ({
  paymentReference: paymentReference || undefined,
  note: note || undefined,
})

/** PATCH /deposits/:id/confirm-payment – nhân viên xác nhận đã nhận tiền CỌC. */
export async function confirmDepositPayment(id, payload) {
  const { data } = await api.patch(`/deposits/${id}/confirm-payment`, cleanPayment(payload))
  return data?.data
}

/** PATCH /deposits/:id/complete – nhân viên xác nhận đã nhận ĐỦ tiền xe → xe SOLD. */
export async function completeDeposit(id, payload) {
  const { data } = await api.patch(`/deposits/${id}/complete`, cleanPayment(payload))
  return data?.data
}

/** PATCH /deposits/:id/refund – ADMIN ghi nhận đã hoàn cọc. */
export async function refundDeposit(id, { refundAmount, refundReference, note }) {
  const { data } = await api.patch(`/deposits/${id}/refund`, {
    refundAmount,
    refundReference: refundReference || undefined,
    note: note || undefined,
  })
  return data?.data
}
