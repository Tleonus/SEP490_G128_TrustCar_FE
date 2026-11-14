/**
 * Lọc, sắp xếp, phân trang danh sách chứng nhận trong bộ nhớ.
 * BE chưa có API liệt kê chứng nhận, nên danh sách được lấy đủ rồi xử lý tại FE.
 *
 * @param {import('../constants/cpoCertificateConstants').CertificateListItem[]} items
 * @param {{ search?: string, status?: string, issuedFrom?: string, issuedTo?: string, sort?: string, page?: number, limit?: number }} query
 * @returns {{ items: Array, total: number, page: number, limit: number, totalPages: number }}
 */
export function queryCertificates(items, query = {}) {
  const { search = '', status = '', issuedFrom = '', issuedTo = '', sort = 'issuedAt:desc', page = 1, limit = 10 } = query
  const keyword = search.trim().toLocaleLowerCase('vi')

  // Ngày cấp so theo ngày lịch Việt Nam (UTC+7) để lọc "đến ngày" bao trọn ngày đó.
  const dayOf = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10) : null)

  const filtered = items.filter((item) => {
    if (status && item.carStatus !== status) return false
    const day = dayOf(item.issuedAt)
    if ((issuedFrom || issuedTo) && !day) return false
    if (issuedFrom && day < issuedFrom) return false
    if (issuedTo && day > issuedTo) return false
    if (!keyword) return true
    return [item.certificateId, item.vehicleCode, item.vehicle?.make, item.vehicle?.model]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('vi').includes(keyword))
  })

  const [field, dir] = sort.split(':')
  const sign = dir === 'asc' ? 1 : -1
  const valueOf = (item) => item[field] ?? ''
  const sorted = [...filtered].sort((a, b) => {
    const left = valueOf(a)
    const right = valueOf(b)
    if (left === right) return a.certificateId.localeCompare(b.certificateId)
    return (left > right ? 1 : -1) * sign
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  return {
    items: sorted.slice((safePage - 1) * limit, safePage * limit),
    total: sorted.length,
    page: safePage,
    limit,
    totalPages,
  }
}
