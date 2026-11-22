import { describe, it, expect } from 'vitest'
import { buildRows } from './compareRows'
import {
  analyzeCars,
  buildPersonaRecommendations,
  buildSuggestedMatchups,
  enrichGroups,
  recommendSimilarCars,
} from './compareInsights'

const sampleCar = (overrides = {}, specs = {}) => ({
  _id: '6adf875aa9c95c345bcfdd11',
  make: 'Mazda',
  model: 'CX-5',
  variant: '2.0 Premium',
  year: 2023,
  mileage: 12000,
  price: 760000000,
  marketPrice: 800000000,
  bodyType: 'SUV',
  fuelType: 'GASOLINE',
  transmission: 'AUTOMATIC',
  driveType: 'FWD',
  ownerType: 'INDIVIDUAL',
  conditionGrade: 'A',
  specifications: {
    color: 'Đỏ',
    interiorColor: 'Đen',
    numberOfSeats: 5,
    numberOfDoors: 5,
    engineDisplacementCC: 1998,
    horsePower: 154,
    torqueNm: 200,
    fuelConsumption: 6.8,
    originCountry: 'Việt Nam',
    safetyRating: '5 sao ASEAN NCAP',
    features: ['Camera 360', 'HUD', 'Cửa sổ trời', 'Cảnh báo điểm mù'],
    ...specs,
  },
  ...overrides,
})

describe('compareInsights', () => {
  const carA = sampleCar()
  const carB = sampleCar(
    {
      _id: '6adf875aa9c95c345bcfdd22',
      make: 'Hyundai',
      model: 'Tucson',
      year: 2021,
      mileage: 35000,
      price: 720000000,
      marketPrice: 730000000,
      conditionGrade: 'B',
    },
    {
      horsePower: 180,
      torqueNm: 265,
      fuelConsumption: 7.5,
      features: ['Camera 360', 'Sạc không dây'],
    },
  )

  it('enrichGroups đánh dấu đúng hàng khác biệt, ô chiến thắng và tiện nghi độc quyền', () => {
    const groups = buildRows([carA, carB])
    const enriched = enrichGroups(groups, [carA, carB])

    const generalGroup = enriched.find((g) => g.key === 'general')
    const yearRow = generalGroup.rows.find((r) => r.key === 'year')
    expect(yearRow.hasDiff).toBe(true)
    expect(yearRow.cells[0].isWinner).toBe(true)
    expect(yearRow.cells[0].winnerLabel).toBe('Đời mới nhất')
    expect(yearRow.cells[1].isWinner).toBe(false)

    const engineGroup = enriched.find((g) => g.key === 'engine')
    const hpRow = engineGroup.rows.find((r) => r.key === 'horsePower')
    expect(hpRow.cells[1].isWinner).toBe(true)
    expect(hpRow.cells[1].barPercent).toBe(100)

    const safetyGroup = enriched.find((g) => g.key === 'safety')
    const featRow = safetyGroup.rows.find((r) => r.key === 'features')
    expect(featRow.cells[0].uniqueItems).toContain('HUD')
    expect(featRow.cells[0].uniqueItems).not.toContain('Camera 360')
  })

  it('analyzeCars và buildPersonaRecommendations chấm điểm 5 chiều và gợi ý theo nhu cầu', () => {
    const analysis = analyzeCars([carA, carB])
    expect(analysis).toHaveLength(2)
    expect(analysis[0].marketSavings).toBe(40000000)
    expect(analysis[0].scores.overall).toBeGreaterThan(60)

    const recs = buildPersonaRecommendations(analysis)
    expect(recs.likenew.winner.id).toBe(carA._id)
    expect(recs.performance.winner.id).toBe(carB._id)
  })

  it('recommendSimilarCars và buildSuggestedMatchups lọc và gợi ý xe phù hợp', () => {
    const pool = [
      carA,
      carB,
      sampleCar({ _id: '6adf875aa9c95c345bcfdd33', make: 'Honda', model: 'CR-V', price: 750000000 }),
      sampleCar({ _id: '6adf875aa9c95c345bcfdd44', make: 'KIA', model: 'Sportage', price: 770000000 }),
    ]

    const similar = recommendSimilarCars([carA, carB], pool, 4)
    expect(similar).toHaveLength(2)
    expect(similar[0].reasonTag).toMatch(/SUV/)

    const pairs = buildSuggestedMatchups(pool, 2)
    expect(pairs).toHaveLength(2)
    expect(pairs[0].cars).toHaveLength(2)
  })
})
