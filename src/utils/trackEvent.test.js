//@vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// trackEvent gọi `services/api` (axios instance). Ta mock nó bằng vi.mock để test không
// chạm network thật.
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

async function loadModule() {
  vi.resetModules()
  const api = (await import('../services/api')).default
  const { trackEvent } = await import('./trackEvent')
  return { api, trackEvent }
}

beforeEach(() => {
  // sessionStorage trong jsdom hoạt động, không cần stub.
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('trackEvent', () => {
  it('gửi POST /track với eventType + carId + metadata', async () => {
    const { api, trackEvent } = await loadModule()
    api.post.mockResolvedValueOnce({ data: { data: { sessionId: 'sess-1' } } })

    trackEvent('VIEW_CAR', { carId: 'car-1', metadata: { stockCode: 'SC-01' } })

    expect(api.post).toHaveBeenCalledWith('/track', {
      eventType: 'VIEW_CAR',
      carId: 'car-1',
      metadata: { stockCode: 'SC-01' },
    })
  })

  it('đính kèm sessionId từ sessionStorage nếu có', async () => {
    const { api, trackEvent } = await loadModule()
    window.sessionStorage.setItem('trustcar_track_session', 'sess-old')
    api.post.mockResolvedValueOnce({ data: { data: { sessionId: 'sess-old' } } })

    trackEvent('WISHLIST_ADD', { carId: 'car-2' })

    expect(api.post).toHaveBeenCalledWith('/track', expect.objectContaining({
      eventType: 'WISHLIST_ADD',
      carId: 'car-2',
      sessionId: 'sess-old',
    }))
  })

  it('lưu lại sessionId mới do BE trả về', async () => {
    const { api, trackEvent } = await loadModule()
    api.post.mockResolvedValueOnce({ data: { data: { sessionId: 'sess-new' } } })

    trackEvent('CALCULATOR_USE')

    // promise chain fire-and-forget → chờ microtask flush
    await new Promise((r) => setTimeout(r, 0))
    expect(window.sessionStorage.getItem('trustcar_track_session')).toBe('sess-new')
  })

  it('nuốt lỗi, không throw khi POST fail', async () => {
    const { api, trackEvent } = await loadModule()
    api.post.mockRejectedValueOnce(new Error('network'))
    expect(() => trackEvent('FILTER_APPLY')).not.toThrow()
  })

  it('bỏ qua khi khách bật Do Not Track', async () => {
    const { api, trackEvent } = await loadModule()
    vi.stubGlobal('navigator', { ...navigator, doNotTrack: '1' })
    trackEvent('VIEW_CAR', { carId: 'car-3' })
    expect(api.post).not.toHaveBeenCalled()
  })

  it('bỏ qua khi khách bật Global Privacy Control', async () => {
    const { api, trackEvent } = await loadModule()
    vi.stubGlobal('navigator', { ...navigator, globalPrivacyControl: true })
    trackEvent('CONTACT_CLICK')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('bỏ qua khi eventType rỗng', async () => {
    const { api, trackEvent } = await loadModule()
    trackEvent('')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('bỏ metadata khi là object rỗng', async () => {
    const { api, trackEvent } = await loadModule()
    api.post.mockResolvedValueOnce({ data: { data: { sessionId: 's' } } })
    trackEvent('VIEW_CAR', { carId: 'car-1', metadata: {} })
    expect(api.post).toHaveBeenCalledWith('/track', { eventType: 'VIEW_CAR', carId: 'car-1' })
  })
})
