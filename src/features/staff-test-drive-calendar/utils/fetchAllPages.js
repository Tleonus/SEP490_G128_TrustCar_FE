// Tải mọi trang của một danh sách, TUẦN TỰ (mỗi trang gọi BE chạy đối soát nên không gọi song song).
// Ref: .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F02, #REQ-F16, NFR-F02 (CF1, CF2)

import { MAX_PAGES } from '../constants/calendarConstants'

const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' })

/**
 * Gọi `fetchPage(page, signal)` lần lượt từ trang 1 tới trang cuối (`meta.totalPages`) hoặc `maxPages`.
 * Lỗi ở bất kỳ trang nào được ném lên (không trả dữ liệu nửa chừng); `signal` đã hủy thì dừng, không gọi trang kế.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F02
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F16
 * @param {(page: number, signal?: AbortSignal) => Promise<{ items: object[], meta?: { totalPages?: number } | null }>} fetchPage
 * @param {{ maxPages?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<{ items: object[], truncated: boolean }>} `truncated`: còn trang chưa tải
 */
export async function fetchAllPages(fetchPage, { maxPages = MAX_PAGES, signal } = {}) {
  const items = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages && page <= maxPages) {
    if (signal?.aborted) throw abortError()
    const result = await fetchPage(page, signal)
    items.push(...(result.items ?? []))
    totalPages = Number(result.meta?.totalPages) || 1
    page += 1
  }
  return { items, truncated: totalPages > maxPages }
}
