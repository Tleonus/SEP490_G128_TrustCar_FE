import api from '../../../services/api'

/**
 * KAN-98 — tóm tắt xác thực chứng nhận khi khách quét mã QR.
 * GET /public/verify/:hash. Hash sai hoặc hết hạn trả 404.
 */
export async function fetchVerifySummary(hash, signal) {
  const { data } = await api.get(`/public/verify/${encodeURIComponent(hash)}`, { signal })
  return data?.data
}
