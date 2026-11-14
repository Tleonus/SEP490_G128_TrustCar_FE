import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api from './api'
import {
  sendChatMessage,
  parsePriceIntent,
  getOrCreateChatSessionId,
  resetChatSessionId,
  resetBackendChatRouteAvailability,
  CHAT_SESSION_STORAGE_KEY,
  CHAT_MESSAGES_STORAGE_KEY,
} from './chatService'

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('./carService', () => ({
  getCars: vi.fn(async () => ({
    items: [
      {
        _id: 'car-1',
        vehicleCode: 'TC-2026-0001',
        make: 'MAZDA',
        model: 'CX-5',
        variant: '2.0 Premium',
        year: 2022,
        price: 685000000,
        mileage: 28000,
        bodyType: 'SUV',
        fuelType: 'GASOLINE',
        transmission: 'AUTOMATIC',
        cpoCertificateId: 'CPO-01',
        images: [{ url: 'https://example.com/cx5.jpg', isPrimary: true }],
      },
    ],
    total: 1,
  })),
  getFeaturedCars: vi.fn(async () => ({ items: [] })),
  sendContactRequest: vi.fn(async () => ({ leadCode: 'LD-0001' })),
}))

vi.mock('./brandService', () => ({
  getFilterOptions: vi.fn(async () => ({
    priceRange: { min: 350000000, max: 1500000000 },
  })),
}))

function createFakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, val) => {
      data[key] = String(val)
    },
    removeItem: (key) => {
      delete data[key]
    },
    clear: () => {
      Object.keys(data).forEach((k) => delete data[k])
    },
  }
}

describe('chatService (FE)', () => {
  let storage

  beforeEach(() => {
    vi.clearAllMocks()
    resetBackendChatRouteAvailability()
    storage = createFakeStorage()
    vi.stubGlobal('sessionStorage', storage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists and resets sessionId in sessionStorage', () => {
    const firstId = getOrCreateChatSessionId()
    expect(firstId).toMatch(/^tc-session-/)
    expect(storage.getItem(CHAT_SESSION_STORAGE_KEY)).toBe(firstId)

    const secondRead = getOrCreateChatSessionId()
    expect(secondRead).toBe(firstId)

    storage.setItem(CHAT_MESSAGES_STORAGE_KEY, '[{"id":"welcome"}]')
    const resetId = resetChatSessionId()
    expect(resetId).toMatch(/^tc-session-/)
    expect(storage.getItem(CHAT_SESSION_STORAGE_KEY)).toBe(resetId)
    expect(storage.getItem(CHAT_MESSAGES_STORAGE_KEY)).toBeNull()
  })

  it('calls POST /public/chat and maps returned vehicle cards, actions, and followUps', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          conversationCode: 'tc-session-abc123',
          reply: 'TrustCar tìm thấy 1 mẫu xe SUV dưới 700 triệu:',
          cars: [
            {
              _id: '65f000000000000000000101',
              vehicleCode: 'TC-2026-0001',
              make: 'MAZDA',
              model: 'CX-5',
              variant: '2.0 Premium',
              year: 2022,
              price: 685000000,
              mileage: 28000,
              bodyType: 'SUV',
              fuelType: 'GASOLINE',
              transmission: 'AUTOMATIC',
              cpoCertificateId: 'CPO-2026-0001',
              images: [{ url: 'https://example.com/cx5.jpg', isPrimary: true }],
            },
          ],
          actions: [{ label: 'Xem danh sách xe phù hợp', to: '/xe?bodyType=SUV' }],
          followUps: ['Tính trả góp Mazda CX-5', 'Đặt lịch lái thử'],
          source: 'hybrid-grounded',
        },
      },
    })

    const result = await sendChatMessage({
      message: 'Tìm xe SUV dưới 700 triệu',
      sessionId: 'tc-session-abc123',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0901234567',
      history: [{ from: 'user', text: 'Xin chào' }],
    })

    expect(api.post).toHaveBeenCalledWith(
      '/public/chat',
      expect.objectContaining({
        message: 'Tìm xe SUV dưới 700 triệu',
        sessionId: 'tc-session-abc123',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
      }),
      expect.objectContaining({ timeout: 15000 })
    )

    expect(result.text).toContain('TrustCar tìm thấy 1 mẫu xe SUV')
    expect(result.cars).toHaveLength(1)
    expect(result.cars[0]).toMatchObject({
      stockCode: 'TC-2026-0001',
      cpo: true,
      to: '/xe/TC-2026-0001',
    })
    expect(result.followUps).toEqual(['Tính trả góp Mazda CX-5', 'Đặt lịch lái thử'])
    expect(result.source).toBe('hybrid-grounded')
  })

  it('parses Vietnamese price intents accurately for fallback mode', () => {
    expect(parsePriceIntent('Tìm xe dưới 500 triệu')).toMatchObject({
      priceMax: 500_000_000,
    })
    expect(parsePriceIntent('Tìm xe từ 500 đến 800 triệu')).toMatchObject({
      priceMin: 500_000_000,
      priceMax: 800_000_000,
    })
  })
})
