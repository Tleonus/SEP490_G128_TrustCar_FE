import { afterEach, describe, expect, it, vi } from 'vitest'

// API_BASE_URL được đọc lúc import config/apiConfig.js, nên mỗi ca nạp lại module sau khi đặt biến môi trường.
// Chuỗi rỗng = không cấu hình (apiConfig rơi về http://localhost:5000/api/v1).
async function loadShareUrl({ api = '', share = '' } = {}) {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', api)
  vi.stubEnv('VITE_SHARE_BASE_URL', share)
  return import('./shareUrl')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('buildShareUrl', () => {
  it('bỏ /api/v1 của API mặc định, trỏ về trang chia sẻ ở gốc Backend', async () => {
    const { buildShareUrl } = await loadShareUrl()
    expect(buildShareUrl('TC-2024-0001')).toBe('http://localhost:5000/share/car/TC-2024-0001')
  })

  it('cắt khoảng trắng và viết hoa mã xe', async () => {
    const { buildShareUrl } = await loadShareUrl()
    expect(buildShareUrl('  tc-2026-0019 ')).toBe('http://localhost:5000/share/car/TC-2026-0019')
  })

  it.each([
    ['dấu / ở cuối', 'https://api.trustcar.vn/api/v1/', 'https://api.trustcar.vn/share/car/TC-2026-0001'],
    ['Backend chạy dưới thư mục con', 'https://trustcar.vn/backend/api/v2', 'https://trustcar.vn/backend/share/car/TC-2026-0001'],
  ])('API có %s', async (_, api, expected) => {
    const { buildShareUrl } = await loadShareUrl({ api })
    expect(buildShareUrl('TC-2026-0001')).toBe(expected)
  })

  it('ưu tiên VITE_SHARE_BASE_URL, bỏ query, hash và dấu / ở cuối', async () => {
    const { buildShareUrl } = await loadShareUrl({ share: 'https://share.trustcar.vn/?utm=x#top' })
    expect(buildShareUrl('TC-2026-0001')).toBe('https://share.trustcar.vn/share/car/TC-2026-0001')
  })

  it.each([
    ['thiếu giao thức', 'trustcar.vn'],
    ['giao thức javascript', 'javascript:alert(1)'],
  ])('bỏ qua VITE_SHARE_BASE_URL %s, dùng địa chỉ API', async (_, share) => {
    const { buildShareUrl } = await loadShareUrl({ share })
    expect(buildShareUrl('TC-2026-0001')).toBe('http://localhost:5000/share/car/TC-2026-0001')
  })

  it('API tương đối thì ghép với origin của trang đang mở', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://trustcar.vn' } })
    const { buildShareUrl } = await loadShareUrl({ api: '/api/v1' })
    expect(buildShareUrl('TC-2026-0001')).toBe('https://trustcar.vn/share/car/TC-2026-0001')
  })

  it('API tương đối mà không có window thì trả null', async () => {
    const { buildShareUrl } = await loadShareUrl({ api: '/api/v1' })
    expect(buildShareUrl('TC-2026-0001')).toBeNull()
  })

  it.each([null, undefined, '', '6650f1a2b3c4d5e6f7a8b9c0', 'TC-26-1', 'TC-2026-0001/../admin', 'CPO-2026113-2780'])(
    'trả null khi mã xe không hợp lệ: %s',
    async (code) => {
      const { buildShareUrl } = await loadShareUrl()
      expect(buildShareUrl(code)).toBeNull()
    },
  )
})

describe('facebookShareUrl / zaloShareUrl', () => {
  const shareUrl = 'http://localhost:5000/share/car/TC-2024-0001'
  const encoded = 'http%3A%2F%2Flocalhost%3A5000%2Fshare%2Fcar%2FTC-2024-0001'

  it('mã hoá link Backend vào tham số u của Facebook', async () => {
    const { facebookShareUrl } = await loadShareUrl()
    expect(facebookShareUrl(shareUrl)).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`)
  })

  it('mã hoá link Backend vào tham số u của Zalo', async () => {
    const { zaloShareUrl } = await loadShareUrl()
    expect(zaloShareUrl(shareUrl)).toBe(`https://zalo.me/share?u=${encoded}`)
  })
})
