import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseSmartSearchQuery,
  buildSearchParamsFromSmartQuery,
  getKeywordSuggestions,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from './smartCarSearch'

function createFakeStorage() {
  const store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
  }
}

describe('smartCarSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createFakeStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('recognizes compact model aliases (cx5, crv, santafe) and infers make automatically', () => {
    const cx5 = parseSmartSearchQuery('Tìm xe cx5 dưới 800 triệu')
    expect(cx5).toMatchObject({
      make: 'MAZDA',
      model: 'CX-5',
      priceMax: 800_000_000,
      cleanSearch: 'CX-5',
      hasStructuredFilters: true,
    })

    const crv = parseSmartSearchQuery('Honda CRV 2022 số tự động')
    expect(crv).toMatchObject({
      make: 'HONDA',
      model: 'CR-V',
      transmission: 'AUTOMATIC',
      yearMin: 2022,
      yearMax: 2022,
      cleanSearch: 'CR-V',
    })
  })

  it('recognizes bodyType, fuelType, transmission, and price range from Vietnamese natural text', () => {
    const parsed = parseSmartSearchQuery('Xe SUV 7 chỗ máy dầu từ 600 đến 900 triệu')
    expect(parsed).toMatchObject({
      bodyType: 'SUV',
      fuelType: 'DIESEL',
      priceMin: 600_000_000,
      priceMax: 900_000_000,
    })
  })

  it('builds URL search params and merges explicit dropdown overrides', () => {
    const { params } = buildSearchParamsFromSmartQuery('Toyota Camry 2.5Q 2021', {
      priceMax: '1000000000',
    })
    expect(params).toEqual({
      make: 'TOYOTA',
      yearMin: '2021',
      yearMax: '2021',
      search: 'Camry 2.5Q',
      priceMax: '1000000000',
    })
  })

  it('returns ranked keyword suggestions for partial or compact queries', () => {
    const cxSuggestions = getKeywordSuggestions('cx5')
    expect(cxSuggestions.length).toBeGreaterThan(0)
    expect(cxSuggestions[0].label).toContain('Mazda CX-5')

    const pickupSuggestions = getKeywordSuggestions('bán tải')
    expect(pickupSuggestions.some((s) => s.params.bodyType === 'PICKUP')).toBe(true)
  })

  it('saves, deduplicates, and clears recent searches in localStorage', () => {
    saveRecentSearch('Mazda CX-5')
    saveRecentSearch('Toyota Camry')
    saveRecentSearch('mazda cx-5')

    expect(getRecentSearches()).toEqual(['mazda cx-5', 'Toyota Camry'])

    clearRecentSearches()
    expect(getRecentSearches()).toEqual([])
  })
})
