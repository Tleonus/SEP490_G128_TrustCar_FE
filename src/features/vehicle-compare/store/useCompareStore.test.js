import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const KEY = 'trustcar_compare'
const ids = ['6adf875aa9c95c345bcfdd11', '6adf875aa9c95c345bcfdd0a', '6adf875aa9c95c345bcfdd03', '6adf875aa9c95c345bcfdd04']
const car = (id, extra = {}) => ({ _id: id, make: 'KIA', model: `M${id.slice(-2)}`, price: 100, ...extra })

function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}

// Mỗi test nạp lại module để store đọc localStorage giả của test đó.
async function loadStore(storage) {
  vi.resetModules()
  if (storage) vi.stubGlobal('localStorage', storage)
  const { useCompareStore } = await import('./useCompareStore')
  return useCompareStore
}

beforeEach(() => { vi.unstubAllGlobals() })
afterEach(() => { vi.unstubAllGlobals() })

describe('useCompareStore', () => {
  it('bắt đầu rỗng và thêm / bỏ xe, ghi vào localStorage', async () => {
    const storage = fakeStorage()
    const store = await loadStore(storage)

    expect(store.getState().items).toEqual([])
    expect(store.getState().toggle(car(ids[0]))).toBe('added')
    expect(store.getState().toggle(car(ids[1]))).toBe('added')
    expect(store.getState().items.map((x) => x.id)).toEqual([ids[0], ids[1]])
    expect(JSON.parse(storage.data[KEY]).map((x) => x.id)).toEqual([ids[0], ids[1]])

    expect(store.getState().toggle(car(ids[0]))).toBe('removed')
    expect(store.getState().items.map((x) => x.id)).toEqual([ids[1]])
  })

  it('chặn xe thứ 4 và giữ nguyên 3 xe', async () => {
    const store = await loadStore(fakeStorage())
    ids.slice(0, 3).forEach((id) => store.getState().toggle(car(id)))

    expect(store.getState().toggle(car(ids[3]))).toBe('full')
    expect(store.getState().items).toHaveLength(3)
  })

  it('xe dữ liệu mẫu (id không hex) bị từ chối', async () => {
    const store = await loadStore(fakeStorage())
    expect(store.getState().toggle({ id: 5, make: 'X' })).toBe('invalid')
    expect(store.getState().items).toEqual([])
  })

  it('đọc lại danh sách đã lưu khi khởi tạo (tải lại trang)', async () => {
    const saved = JSON.stringify([{ id: ids[0], title: 'KIA A', image: null, price: 5 }])
    const store = await loadStore(fakeStorage({ [KEY]: saved }))
    expect(store.getState().items.map((x) => x.id)).toEqual([ids[0]])
  })

  it('dữ liệu lưu hỏng hoặc sai dạng bị bỏ qua', async () => {
    expect((await loadStore(fakeStorage({ [KEY]: '{không phải json' }))).getState().items).toEqual([])
    expect((await loadStore(fakeStorage({ [KEY]: '{"id":"x"}' }))).getState().items).toEqual([])
    expect((await loadStore(fakeStorage({ [KEY]: '[{"id":"abc"}]' }))).getState().items).toEqual([])
  })

  it('remove, prune và clear cập nhật cả localStorage', async () => {
    const storage = fakeStorage()
    const store = await loadStore(storage)
    ids.slice(0, 3).forEach((id) => store.getState().toggle(car(id)))

    store.getState().remove(ids[1])
    expect(store.getState().items.map((x) => x.id)).toEqual([ids[0], ids[2]])

    store.getState().prune([ids[0]])
    expect(JSON.parse(storage.data[KEY]).map((x) => x.id)).toEqual([ids[2]])

    store.getState().clear()
    expect(store.getState().items).toEqual([])
    expect(JSON.parse(storage.data[KEY])).toEqual([])
  })

  it('localStorage ném lỗi: vẫn chọn được trong phiên, không crash', async () => {
    const broken = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    }
    const store = await loadStore(broken)

    expect(store.getState().items).toEqual([])
    expect(store.getState().toggle(car(ids[0]))).toBe('added')
    expect(store.getState().items.map((x) => x.id)).toEqual([ids[0]])
  })

  it('không có localStorage (môi trường không hỗ trợ) vẫn chạy', async () => {
    const store = await loadStore()
    expect(store.getState().toggle(car(ids[0]))).toBe('added')
  })
})
