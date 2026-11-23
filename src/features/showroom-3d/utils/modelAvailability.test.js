import { describe, expect, it } from 'vitest'
import { findCarsWithModels, hasModel } from './modelAvailability'

const reply = (status, type) => ({ ok: status >= 200 && status < 300, headers: new Map([['content-type', type]]) })

describe('showroom-3d modelAvailability', () => {
  it('có file GLB thật -> true', async () => {
    expect(await hasModel('/a.glb', async () => reply(200, 'model/gltf-binary'))).toBe(true)
  })

  it('máy chủ trả index.html (SPA) cho file không có -> false', async () => {
    expect(await hasModel('/a.glb', async () => reply(200, 'text/html; charset=utf-8'))).toBe(false)
  })

  it('404 hoặc lỗi mạng -> false', async () => {
    expect(await hasModel('/a.glb', async () => reply(404, 'text/plain'))).toBe(false)
    expect(await hasModel('/a.glb', async () => { throw new Error('offline') })).toBe(false)
  })

  it('chỉ giữ xe có mô hình, theo thứ tự mã xe, hỏi bằng HEAD', async () => {
    const asked = []
    const fake = async (url, init) => {
      asked.push([url, init.method])
      return url.includes('0002') || url.includes('0010') ? reply(200, 'application/octet-stream') : reply(200, 'text/html')
    }
    const cars = [{ vehicleCode: 'TC-2026-0010' }, { vehicleCode: 'TC-2026-0001' }, { vehicleCode: 'TC-2026-0002' }]
    const got = await findCarsWithModels(cars, fake)
    expect(got.map((c) => c.vehicleCode)).toEqual(['TC-2026-0002', 'TC-2026-0010'])
    expect(asked.every(([, m]) => m === 'HEAD')).toBe(true)
  })
})

describe('showroom-3d manifest', () => {
  const okJson = (data) => async () => ({ ok: true, headers: new Map([['content-type', 'application/json']]), json: async () => data })

  it('đọc manifest; HTML (SPA) hoặc lỗi -> null', async () => {
    const { loadManifest } = await import('./modelAvailability')
    expect(await loadManifest(okJson({ 'TC-2026-0001': { model: true, photos: [] } }))).toEqual({ 'TC-2026-0001': { model: true, photos: [] } })
    expect(await loadManifest(async () => reply(200, 'text/html'))).toBeNull()
    expect(await loadManifest(async () => { throw new Error('x') })).toBeNull()
    expect(await loadManifest(okJson([1, 2]))).toBeNull()
  })

  it('ảnh trong manifest: chỉ nhận đường dẫn trong thư mục của chính xe đó', async () => {
    const { manifestPhotos } = await import('./modelAvailability')
    const m = { 'TC-2026-0001': { photos: ['/showroom-3d/cars/TC-2026-0001/1.webp', 'https://evil.example/x.jpg', '/showroom-3d/cars/TC-2026-0002/1.webp'] } }
    expect(manifestPhotos(m, 'TC-2026-0001')).toEqual(['/showroom-3d/cars/TC-2026-0001/1.webp'])
    expect(manifestPhotos(m, '../x')).toEqual([])
    expect(manifestPhotos(null, 'TC-2026-0001')).toEqual([])
  })

  it('có manifest thì lấy xe có mô hình theo manifest, không hỏi từng file', async () => {
    let asked = 0
    const got = await findCarsWithModels([{ vehicleCode: 'TC-2026-0025' }, { vehicleCode: 'TC-2026-0001' }, { vehicleCode: 'TC-2026-0002' }],
      async () => { asked++; return reply(200, 'model/gltf-binary') },
      { 'TC-2026-0001': { model: true }, 'TC-2026-0025': { model: true }, 'TC-2026-0002': { model: false } })
    expect(got.map((c) => c.vehicleCode)).toEqual(['TC-2026-0001', 'TC-2026-0025'])
    expect(asked).toBe(0)
  })
})

describe('showroom-3d màu sơn thật trong manifest', () => {
  it('chỉ nhận mã màu #rrggbb', async () => {
    const { manifestPaint } = await import('./modelAvailability')
    expect(manifestPaint({ 'TC-2026-0025': { paint: '#0e1013' } }, 'TC-2026-0025')).toBe('#0e1013')
    expect(manifestPaint({ 'TC-2026-0025': { paint: 'red; x' } }, 'TC-2026-0025')).toBeNull()
    expect(manifestPaint(null, 'TC-2026-0025')).toBeNull()
  })
})
