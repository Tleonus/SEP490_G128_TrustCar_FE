import { describe, it, expect } from 'vitest'
import { buildPublicCarUrl, normalizePublicBaseUrl } from './qrTargetUrl'

describe('normalizePublicBaseUrl', () => {
  it('giữ nguyên origin hợp lệ', () => {
    expect(normalizePublicBaseUrl('https://trustcar.vn')).toBe('https://trustcar.vn')
  })

  it('bỏ dấu / ở cuối, bỏ query và hash', () => {
    expect(normalizePublicBaseUrl('https://trustcar.vn///?utm=x#top')).toBe('https://trustcar.vn')
  })

  it('giữ đường dẫn con khi web chạy dưới thư mục', () => {
    expect(normalizePublicBaseUrl('https://example.com/trustcar/')).toBe('https://example.com/trustcar')
  })

  it('cắt khoảng trắng đầu cuối', () => {
    expect(normalizePublicBaseUrl('  http://localhost:5173  ')).toBe('http://localhost:5173')
  })

  it.each([
    ['rỗng', ''],
    ['không phải chuỗi', undefined],
    ['thiếu giao thức', 'trustcar.vn'],
    ['giao thức javascript', 'javascript:alert(1)'],
    ['giao thức ftp', 'ftp://trustcar.vn'],
  ])('trả null khi %s', (_, value) => {
    expect(normalizePublicBaseUrl(value)).toBeNull()
  })
})

describe('buildPublicCarUrl', () => {
  it('dựng URL trang chi tiết xe công khai theo mã xe', () => {
    expect(buildPublicCarUrl({ baseUrl: 'https://trustcar.vn', carId: 'TC-2026-0001' })).toBe(
      'https://trustcar.vn/xe/TC-2026-0001',
    )
  })

  it('nhận ObjectId', () => {
    expect(buildPublicCarUrl({ baseUrl: 'https://trustcar.vn/', carId: '6650f1a2b3c4d5e6f7a8b9c0' })).toBe(
      'https://trustcar.vn/xe/6650f1a2b3c4d5e6f7a8b9c0',
    )
  })

  it('mã hoá ký tự đặc biệt để QR không trỏ sai trang', () => {
    expect(buildPublicCarUrl({ baseUrl: 'https://trustcar.vn', carId: 'a/b?c#d' })).toBe(
      'https://trustcar.vn/xe/a%2Fb%3Fc%23d',
    )
  })

  it('không dùng localhost thay cho cấu hình rỗng', () => {
    expect(buildPublicCarUrl({ baseUrl: '', carId: 'TC-2026-0001' })).toBeNull()
  })

  it('trả null khi thiếu carId', () => {
    expect(buildPublicCarUrl({ baseUrl: 'https://trustcar.vn', carId: '  ' })).toBeNull()
    expect(buildPublicCarUrl({ baseUrl: 'https://trustcar.vn', carId: undefined })).toBeNull()
  })

  it('kết quả luôn là URL tuyệt đối http(s)', () => {
    const url = buildPublicCarUrl({ baseUrl: 'http://192.168.1.10:5173', carId: 'TC-2026-0001' })
    expect(new URL(url).protocol).toBe('http:')
    expect(url).toBe('http://192.168.1.10:5173/xe/TC-2026-0001')
  })
})
