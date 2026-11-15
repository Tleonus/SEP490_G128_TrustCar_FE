import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn() },
}))

const { default: api } = await import('../../../services/api')
const { fetchAuditLogs, fetchAuditLog, fetchAuditMeta } = await import('./auditLogsApi')

const signal = new AbortController().signal
beforeEach(() => vi.resetAllMocks())

describe('auditLogsApi: đúng đường dẫn, tham số và signal (hợp đồng BE)', () => {
  it('fetchAuditLogs gọi /admin/activity-logs với params và signal, trả items + meta', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: [{ id: '1' }], meta: { page: 1, total: 1 } } })
    const params = { page: 2, limit: 20, eventType: 'USER_LOGIN' }
    const result = await fetchAuditLogs(params, signal)
    expect(api.get).toHaveBeenCalledWith('/admin/activity-logs', { params, signal })
    expect(result).toEqual({ items: [{ id: '1' }], meta: { page: 1, total: 1 } })
  })

  it('thiếu data hoặc meta thì trả mảng rỗng và null thay vì lỗi', async () => {
    api.get.mockResolvedValue({ data: { success: true } })
    expect(await fetchAuditLogs({ page: 1, limit: 20 })).toEqual({ items: [], meta: null })
  })

  it('fetchAuditLog gọi /admin/activity-logs/:id và trả bản ghi', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 'abc', changes: null } } })
    const result = await fetchAuditLog('abc', signal)
    expect(api.get).toHaveBeenCalledWith('/admin/activity-logs/abc', { signal })
    expect(result).toEqual({ id: 'abc', changes: null })
  })

  it('id được mã hóa nên không thoát khỏi đường dẫn', async () => {
    api.get.mockResolvedValue({ data: { data: {} } })
    await fetchAuditLog('../users/1', signal)
    expect(api.get.mock.calls[0][0]).toBe('/admin/activity-logs/..%2Fusers%2F1')
  })

  it('fetchAuditMeta gọi /admin/activity-logs/meta và chuẩn hóa kết quả', async () => {
    api.get.mockResolvedValue({ data: { data: { eventTypes: ['A', 'B'], targetModels: ['Car'] } } })
    expect(await fetchAuditMeta(signal)).toEqual({ eventTypes: ['A', 'B'], targetModels: ['Car'] })
    expect(api.get).toHaveBeenCalledWith('/admin/activity-logs/meta', { signal })
  })

  it('fetchAuditMeta thiếu dữ liệu → hai mảng rỗng', async () => {
    api.get.mockResolvedValue({ data: {} })
    expect(await fetchAuditMeta()).toEqual({ eventTypes: [], targetModels: [] })
  })

  it('không bắt lỗi: lỗi axios được ném nguyên vẹn lên hook', async () => {
    const boom = Object.assign(new Error('Network Error'), { response: { status: 403 } })
    api.get.mockRejectedValue(boom)
    await expect(fetchAuditLogs({ page: 1, limit: 20 })).rejects.toBe(boom)
    await expect(fetchAuditLog('x')).rejects.toBe(boom)
    await expect(fetchAuditMeta()).rejects.toBe(boom)
  })

  it('không tự thử lại', async () => {
    api.get.mockRejectedValue(new Error('x'))
    await expect(fetchAuditLogs({})).rejects.toThrow()
    expect(api.get).toHaveBeenCalledTimes(1)
  })
})
