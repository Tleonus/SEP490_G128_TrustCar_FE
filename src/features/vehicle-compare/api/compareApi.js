import api from '../../../services/api'

/**
 * Gọi API so sánh xe. Công khai: khách chưa đăng nhập, khách hàng, nhân viên và admin đều dùng được
 * (không cần token). Dùng axios `api` có sẵn.
 * Không dùng dữ liệu mẫu: lỗi được ném lên cho hook phân loại.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F12
 * @param {string[]} ids - 2–3 id xe (24 ký tự hex)
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ cars: object[], unavailableIds: string[] }>}
 */
export async function fetchComparison(ids, signal) {
  const response = await api.get('/public/cars/compare', {
    params: { ids: ids.join(',') },
    signal,
  })
  return response.data.data
}
