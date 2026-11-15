import { describe, expect, it, vi } from 'vitest'
import { fetchAllPages } from './fetchAllPages'

const pageOf = (n, totalPages, size = 2) => ({
  items: Array.from({ length: size }, (_, i) => ({ id: `${n}-${i}` })),
  meta: { page: n, totalPages },
})

describe('fetchAllPages', () => {
  it('một trang: gọi đúng một lần', async () => {
    const fetchPage = vi.fn(async () => pageOf(1, 1))
    const result = await fetchAllPages(fetchPage)
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(result.items).toHaveLength(2)
    expect(result.truncated).toBe(false)
  })

  it('thiếu meta coi là một trang', async () => {
    const fetchPage = vi.fn(async () => ({ items: [{ id: 'x' }], meta: null }))
    expect(await fetchAllPages(fetchPage)).toEqual({ items: [{ id: 'x' }], truncated: false })
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('ba trang: gọi LẦN LƯỢT (trang sau chỉ bắt đầu khi trang trước xong), gộp đủ', async () => {
    const log = []
    let running = 0
    const fetchPage = vi.fn(async (page) => {
      running += 1
      log.push({ page, running })
      await new Promise((resolve) => setTimeout(resolve, 5))
      running -= 1
      return pageOf(page, 3)
    })
    const result = await fetchAllPages(fetchPage)
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 2, 3])
    expect(log.every((entry) => entry.running === 1)).toBe(true)
    expect(result.items).toHaveLength(6)
    expect(result.truncated).toBe(false)
  })

  it('cắt ở maxPages và báo truncated', async () => {
    const fetchPage = vi.fn(async (page) => pageOf(page, 20))
    const result = await fetchAllPages(fetchPage, { maxPages: 8 })
    expect(fetchPage).toHaveBeenCalledTimes(8)
    expect(result.items).toHaveLength(16)
    expect(result.truncated).toBe(true)
  })

  it('đúng bằng maxPages thì không truncated', async () => {
    const fetchPage = vi.fn(async (page) => pageOf(page, 8))
    expect((await fetchAllPages(fetchPage, { maxPages: 8 })).truncated).toBe(false)
  })

  it('lỗi ở trang 2: ném lỗi, không gọi trang 3, không trả dữ liệu nửa chừng', async () => {
    const boom = new Error('mạng')
    const fetchPage = vi.fn(async (page) => {
      if (page === 2) throw boom
      return pageOf(page, 3)
    })
    await expect(fetchAllPages(fetchPage)).rejects.toBe(boom)
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('đã hủy giữa chừng: dừng, không gọi trang kế', async () => {
    const controller = new AbortController()
    const fetchPage = vi.fn(async (page) => {
      if (page === 1) controller.abort()
      return pageOf(page, 3)
    })
    await expect(fetchAllPages(fetchPage, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('truyền signal cho từng trang', async () => {
    const controller = new AbortController()
    const fetchPage = vi.fn(async () => pageOf(1, 1))
    await fetchAllPages(fetchPage, { signal: controller.signal })
    expect(fetchPage).toHaveBeenCalledWith(1, controller.signal)
  })
})
