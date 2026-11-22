import api from '../../../services/api'

/**
 * KAN-100 — gọi API analytics tổng hợp một lần duy nhất.
 * Backend trả `{ range, salesByMonth, leadsFunnel, topCars, avgDaysInStock, revenueByStaff }`.
 * Chuyển `from`/`to` thành chuỗi ISO để FE khỏi phải lo timezone.
 */
export async function fetchAnalyticsOverview(range = {}, signal) {
  const params = {}
  if (range.from) params.from = range.from instanceof Date ? range.from.toISOString() : range.from
  if (range.to)   params.to   = range.to instanceof Date ? range.to.toISOString() : range.to
  const { data } = await api.get('/manage/analytics/overview', { params, signal })
  return data?.data
}

export default { fetchAnalyticsOverview }
