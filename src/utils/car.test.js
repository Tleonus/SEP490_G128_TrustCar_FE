import { describe, it, expect } from 'vitest'
import { getCarPriceComparison } from './car'

describe('getCarPriceComparison', () => {
  it('returns null when car or price is invalid', () => {
    expect(getCarPriceComparison(null)).toBeNull()
    expect(getCarPriceComparison({ price: 0 })).toBeNull()
    expect(getCarPriceComparison({ price: -100 })).toBeNull()
  })

  it('uses explicit marketPrice / newCarPrice when greater than used price', () => {
    const res = getCarPriceComparison({
      make: 'TOYOTA',
      model: 'Camry',
      variant: '2.5Q',
      year: 2022,
      price: 1000000000,
      marketPrice: 1500000000,
    })
    expect(res).not.toBeNull()
    expect(res.usedPrice).toBe(1000000000)
    expect(res.newCarPrice).toBe(1500000000)
    expect(res.savingAmount).toBe(500000000)
    expect(res.savingPercent).toBe(33)
  })

  it('matches reference new car price for popular showroom models', () => {
    const res = getCarPriceComparison({
      make: 'FORD',
      model: 'Everest',
      variant: 'Titanium 4x4',
      year: 2024,
      price: 1250000000,
    })
    expect(res).not.toBeNull()
    expect(res.newCarPrice).toBe(1620000000)
    expect(res.savingAmount).toBe(370000000)
    expect(res.savingPercent).toBe(23)
  })

  it('estimates realistic new car price for unlisted models based on year and mileage', () => {
    const res = getCarPriceComparison({
      make: 'HONDA',
      model: 'Civic',
      variant: 'RS',
      year: 2022,
      mileage: 40000,
      price: 680000000,
    })
    expect(res).not.toBeNull()
    expect(res.newCarPrice).toBeGreaterThan(res.usedPrice)
    expect(res.savingAmount).toBe(res.newCarPrice - res.usedPrice)
    expect(res.savingPercent).toBeGreaterThan(0)
  })
})
