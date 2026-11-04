import {
  CERT_SORT_OPTIONS,
  CERT_STATUS_FILTER_OPTIONS,
  DEFAULT_CERT_SORT,
  CERT_PAGE_SIZE,
} from '../constants/cpoCertificateConstants'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const VALID_SORTS = CERT_SORT_OPTIONS.map((option) => option.value)
const VALID_STATUSES = CERT_STATUS_FILTER_OPTIONS.map((option) => option.value)

/**
 * Đọc bộ lọc danh sách chứng nhận từ URL. Giá trị lạ bị bỏ qua để link cũ/sửa tay không làm vỡ trang.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ search: string, status: string, issuedFrom: string, issuedTo: string, sort: string, page: number, limit: number }}
 */
export function parseCertificateListParams(searchParams) {
  const get = (key) => (searchParams.get(key) || '').trim()
  const status = get('status')
  const sort = get('sort')
  const issuedFrom = get('from')
  const issuedTo = get('to')
  const page = Number.parseInt(get('page'), 10)

  return {
    search: get('q').slice(0, 100),
    status: VALID_STATUSES.includes(status) ? status : '',
    issuedFrom: DATE_RE.test(issuedFrom) ? issuedFrom : '',
    issuedTo: DATE_RE.test(issuedTo) ? issuedTo : '',
    sort: VALID_SORTS.includes(sort) ? sort : DEFAULT_CERT_SORT,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: CERT_PAGE_SIZE,
  }
}

/**
 * Ghi thay đổi bộ lọc vào URL. Giá trị rỗng/mặc định bị xoá cho URL gọn.
 * Mọi thay đổi khác ngoài "page" sẽ đưa về trang 1.
 *
 * @param {URLSearchParams} searchParams  URL hiện tại.
 * @param {Object<string, string|number|null|undefined>} changes  Khoá: q, status, from, to, sort, page.
 * @returns {URLSearchParams}
 */
export function applyCertificateListChanges(searchParams, changes) {
  const next = new URLSearchParams(searchParams)
  Object.entries(changes).forEach(([key, value]) => {
    const isDefault = (key === 'sort' && value === DEFAULT_CERT_SORT) || (key === 'page' && Number(value) === 1)
    if (value === undefined || value === null || value === '' || isDefault) next.delete(key)
    else next.set(key, String(value))
  })
  if (!('page' in changes)) next.delete('page')
  return next
}
