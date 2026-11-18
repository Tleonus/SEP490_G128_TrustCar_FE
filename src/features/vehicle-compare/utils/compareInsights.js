// Phân tích thông số, tạo highlight đa sắc và hệ thống gợi ý thông minh (Smart Recommend) cho trang so sánh xe.

import { formatPrice, formatMileage } from '../../../utils/format'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, labelFor } from '../constants/compareLabels'
import { isDifferent } from './compareRows'

export const CAR_LED_THEMES = [
  {
    key: 'champagne',
    name: 'Champagne Gold',
    badge: 'VỊ TRÍ #1',
    primary: '#c9a227',
    glow: '#e5c878',
    softBg: 'rgba(201, 162, 39, 0.10)',
    border: 'rgba(201, 162, 39, 0.42)',
    gradient: 'linear-gradient(90deg, #b8911b 0%, #e5c878 100%)',
  },
  {
    key: 'platinum',
    name: 'Platinum Daylight',
    badge: 'VỊ TRÍ #2',
    primary: '#6488a8',
    glow: '#9cc0de',
    softBg: 'rgba(100, 136, 168, 0.10)',
    border: 'rgba(148, 184, 218, 0.38)',
    gradient: 'linear-gradient(90deg, #527594 0%, #9cc0de 100%)',
  },
  {
    key: 'emerald',
    name: 'Titanium Sage',
    badge: 'VỊ TRÍ #3',
    primary: '#2e8b67',
    glow: '#6cc4a1',
    softBg: 'rgba(46, 139, 103, 0.10)',
    border: 'rgba(108, 196, 161, 0.38)',
    gradient: 'linear-gradient(90deg, #247354 0%, #6cc4a1 100%)',
  },
]

export const GROUP_THEMES = {
  general: {
    accent: '#c9a227',
    badge: 'TỔNG QUAN',
    icon: 'compass',
    gradient: 'linear-gradient(90deg, rgba(201, 162, 39, 0.10) 0%, transparent 100%)',
  },
  engine: {
    accent: '#b8911b',
    badge: 'VẬN HÀNH',
    icon: 'thunder',
    gradient: 'linear-gradient(90deg, rgba(201, 162, 39, 0.10) 0%, transparent 100%)',
  },
  seats: {
    accent: '#64748b',
    badge: 'KHÔNG GIAN',
    icon: 'layout',
    gradient: 'linear-gradient(90deg, rgba(100, 116, 139, 0.10) 0%, transparent 100%)',
  },
  safety: {
    accent: '#1f8a4c',
    badge: 'AN TOÀN & TIỆN NGHI',
    icon: 'safety',
    gradient: 'linear-gradient(90deg, rgba(31, 138, 76, 0.09) 0%, transparent 100%)',
  },
}

const GRADE_SCORE = { A: 4, B: 3, C: 2, D: 1 }

const numOrNull = (val) => (typeof val === 'number' && Number.isFinite(val) && val > 0 ? val : null)

const ROW_RULES = {
  year: {
    getter: (c) => numOrNull(c.year),
    mode: 'max',
    winnerLabel: 'Đời mới nhất',
    color: 'emerald',
  },
  mileage: {
    getter: (c) => (typeof c.mileage === 'number' && c.mileage >= 0 ? c.mileage : null),
    mode: 'min',
    winnerLabel: 'Odo thấp nhất',
    color: 'cyan',
    showBar: true,
  },
  conditionGrade: {
    getter: (c) => GRADE_SCORE[c.conditionGrade] ?? null,
    mode: 'max',
    winnerLabel: 'Tình trạng tốt nhất',
    color: 'gold',
  },
  engineDisplacementCC: {
    getter: (c) => numOrNull(c.specifications?.engineDisplacementCC),
    mode: 'max',
    winnerLabel: 'Dung tích lớn nhất',
    color: 'amber',
    showBar: true,
  },
  horsePower: {
    getter: (c) => numOrNull(c.specifications?.horsePower),
    mode: 'max',
    winnerLabel: 'Mã lực mạnh nhất',
    color: 'orange',
    showBar: true,
  },
  torqueNm: {
    getter: (c) => numOrNull(c.specifications?.torqueNm),
    mode: 'max',
    winnerLabel: 'Lực kéo cao nhất',
    color: 'violet',
    showBar: true,
  },
  fuelConsumption: {
    getter: (c) => numOrNull(c.specifications?.fuelConsumption),
    mode: 'min',
    winnerLabel: 'Tiết kiệm nhất',
    color: 'emerald',
    showBar: true,
  },
  numberOfSeats: {
    getter: (c) => numOrNull(c.specifications?.numberOfSeats),
    mode: 'max',
    winnerLabel: 'Rộng rãi nhất',
    color: 'violet',
  },
  features: {
    getter: (c) => {
      const len = Array.isArray(c.specifications?.features) ? c.specifications.features.length : 0
      return len > 0 ? len : null
    },
    mode: 'max',
    winnerLabel: 'Nhiều tiện nghi nhất',
    color: 'emerald',
  },
}

/**
 * Làm giàu dữ liệu hàng bảng so sánh với trạng thái khác biệt, người chiến thắng từng dòng,
 * thanh % trực quan và tiện nghi độc quyền.
 */
export function enrichGroups(groups, cars) {
  const list = Array.isArray(cars) ? cars : []

  return groups.map((group) => {
    const theme = GROUP_THEMES[group.key] ?? GROUP_THEMES.general
    let diffCount = 0

    const enrichedRows = group.rows.map((row) => {
      const hasDiff = isDifferent(row)
      if (hasDiff) diffCount += 1

      const rule = ROW_RULES[row.key]
      const rawValues = rule ? list.map((car) => rule.getter(car)) : list.map(() => null)
      const validValues = rawValues.filter((v) => v != null)

      let bestVal = null
      let maxVal = null
      if (rule && validValues.length >= 2 && hasDiff) {
        bestVal = rule.mode === 'max' ? Math.max(...validValues) : Math.min(...validValues)
        maxVal = Math.max(...validValues)
      } else if (rule && validValues.length >= 1) {
        maxVal = Math.max(...validValues)
      }

      // Tìm tiện nghi chung vs tiện nghi riêng biệt
      let sharedFeatures = new Set()
      if (row.key === 'features' && list.length >= 2) {
        const sets = row.cells.map((cell) => new Set(cell.items ?? []))
        const first = sets[0] ?? new Set()
        sharedFeatures = new Set([...first].filter((item) => sets.every((s) => s.has(item))))
      }

      const cells = row.cells.map((cell, idx) => {
        const val = rawValues[idx]
        const isWinner = bestVal != null && val != null && val === bestVal
        let barPercent = null
        if (rule?.showBar && val != null && maxVal != null && maxVal > 0) {
          barPercent = Math.max(14, Math.round((val / maxVal) * 100))
        }

        const uniqueItems =
          row.key === 'features' && Array.isArray(cell.items)
            ? cell.items.filter((item) => !sharedFeatures.has(item))
            : []

        return {
          ...cell,
          rawValue: val,
          isWinner,
          winnerLabel: isWinner ? rule.winnerLabel : null,
          highlightColor: rule?.color ?? 'cyan',
          barPercent,
          uniqueItems,
        }
      })

      return {
        ...row,
        hasDiff,
        highlightColor: rule?.color ?? 'cyan',
        cells,
      }
    })

    return {
      ...group,
      theme,
      diffCount,
      rows: enrichedRows,
    }
  })
}

/**
 * Chuẩn hóa điểm (65 -> 98) cho một mảng giá trị số giữa các xe đang so sánh.
 */
function normalizeMetric(values, mode = 'max', fallback = 74) {
  const valid = values.filter((v) => v != null && Number.isFinite(v))
  if (valid.length === 0) return values.map(() => fallback)
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  if (max === min) return values.map((v) => (v != null ? 88 : fallback))

  return values.map((v) => {
    if (v == null || !Number.isFinite(v)) return fallback
    const ratio = mode === 'max' ? (v - min) / (max - min) : (max - v) / (max - min)
    return Math.round(68 + ratio * 30)
  })
}

export const titleOfCar = (car) =>
  [car?.make, car?.model, car?.variant].filter(Boolean).join(' ') || 'Xe TrustCar'

/**
 * Phân tích tổng hợp điểm số 5 chiều, lợi thế nổi bật và huy hiệu chiến thắng cho từng xe.
 */
export function analyzeCars(cars) {
  const list = Array.isArray(cars) ? cars : []
  if (list.length === 0) return []

  const prices = list.map((c) => numOrNull(c.price))
  const years = list.map((c) => numOrNull(c.year))
  const mileages = list.map((c) => (typeof c.mileage === 'number' && c.mileage >= 0 ? c.mileage : null))
  const grades = list.map((c) => GRADE_SCORE[c.conditionGrade] ?? null)
  const hps = list.map((c) => numOrNull(c.specifications?.horsePower))
  const torques = list.map((c) => numOrNull(c.specifications?.torqueNm))
  const fuels = list.map((c) => numOrNull(c.specifications?.fuelConsumption))
  const featureCounts = list.map((c) =>
    Array.isArray(c.specifications?.features) ? c.specifications.features.length : 0,
  )
  const seats = list.map((c) => numOrNull(c.specifications?.numberOfSeats))

  const priceScores = normalizeMetric(prices, 'min', 76)
  const yearScores = normalizeMetric(years, 'max', 75)
  const mileageScores = normalizeMetric(mileages, 'min', 75)
  const gradeScores = normalizeMetric(grades, 'max', 78)
  const hpScores = normalizeMetric(hps, 'max', 74)
  const torqueScores = normalizeMetric(torques, 'max', 74)
  const fuelScores = normalizeMetric(fuels, 'min', 76)
  const featureScores = normalizeMetric(featureCounts, 'max', 74)
  const seatScores = normalizeMetric(seats, 'max', 78)

  const minPrice = prices.filter(Boolean).length >= 2 ? Math.min(...prices.filter(Boolean)) : null
  const maxPrice = prices.filter(Boolean).length >= 2 ? Math.max(...prices.filter(Boolean)) : null
  const maxYear = years.filter(Boolean).length >= 2 ? Math.max(...years.filter(Boolean)) : null
  const minMileage =
    mileages.filter((v) => v != null).length >= 2 ? Math.min(...mileages.filter((v) => v != null)) : null
  const maxHp = hps.filter(Boolean).length >= 2 ? Math.max(...hps.filter(Boolean)) : null
  const minFuel = fuels.filter(Boolean).length >= 2 ? Math.min(...fuels.filter(Boolean)) : null
  const maxFeatures = Math.max(...featureCounts)
  const minFeatures = Math.min(...featureCounts)

  const results = list.map((car, idx) => {
    const theme = CAR_LED_THEMES[idx % CAR_LED_THEMES.length]

    // Điểm 5 trụ cột
    const marketSavings =
      numOrNull(car.marketPrice) && numOrNull(car.price) && car.marketPrice > car.price
        ? car.marketPrice - car.price
        : 0
    const valueScore = Math.min(99, Math.round(priceScores[idx] + (marketSavings > 0 ? 5 : 0)))
    const conditionScore = Math.round(yearScores[idx] * 0.4 + mileageScores[idx] * 0.35 + gradeScores[idx] * 0.25)
    const performanceScore = Math.round(hpScores[idx] * 0.6 + torqueScores[idx] * 0.4)
    const ecoBonus = car.fuelType === 'ELECTRIC' ? 10 : car.fuelType === 'HYBRID' ? 7 : car.fuelType === 'DIESEL' ? 3 : 0
    const economyScore = Math.min(99, Math.round(fuelScores[idx] + ecoBonus))
    const comfortScore = Math.round(featureScores[idx] * 0.65 + seatScores[idx] * 0.35)

    const overallScore = Math.round(
      valueScore * 0.24 +
        conditionScore * 0.22 +
        performanceScore * 0.18 +
        economyScore * 0.18 +
        comfortScore * 0.18,
    )

    // Các điểm mạnh cụ thể của xe này
    const highlights = []
    if (minPrice != null && maxPrice !== minPrice && car.price === minPrice) {
      const diff = maxPrice - minPrice
      highlights.push({
        type: 'price',
        text: `Giá tốt nhất (tiết kiệm tới ${formatPrice(diff)})`,
        short: 'Giá tốt nhất',
        color: 'emerald',
      })
    }
    if (marketSavings > 0) {
      highlights.push({
        type: 'market',
        text: `Thấp hơn giá thị trường ${formatPrice(marketSavings)}`,
        short: `Rẻ hơn TT ${formatPrice(marketSavings)}`,
        color: 'gold',
      })
    }
    if (maxYear != null && new Set(years.filter(Boolean)).size > 1 && car.year === maxYear) {
      highlights.push({
        type: 'year',
        text: `Đời xe mới nhất (${car.year})`,
        short: `Đời mới nhất (${car.year})`,
        color: 'cyan',
      })
    }
    if (
      minMileage != null &&
      new Set(mileages.filter((v) => v != null)).size > 1 &&
      car.mileage === minMileage
    ) {
      highlights.push({
        type: 'mileage',
        text: `Odo thấp nhất (${formatMileage(car.mileage)})`,
        short: 'Odo thấp nhất',
        color: 'cyan',
      })
    }
    if (maxHp != null && new Set(hps.filter(Boolean)).size > 1 && car.specifications?.horsePower === maxHp) {
      highlights.push({
        type: 'power',
        text: `Động cơ mạnh nhất (${maxHp} HP)`,
        short: `${maxHp} HP mạnh nhất`,
        color: 'orange',
      })
    }
    if (
      minFuel != null &&
      new Set(fuels.filter(Boolean)).size > 1 &&
      car.specifications?.fuelConsumption === minFuel
    ) {
      highlights.push({
        type: 'fuel',
        text: `Tiết kiệm nhiên liệu nhất (${minFuel} L/100km)`,
        short: 'Tiết kiệm xăng nhất',
        color: 'emerald',
      })
    }
    if (maxFeatures > minFeatures && featureCounts[idx] === maxFeatures && maxFeatures > 0) {
      highlights.push({
        type: 'features',
        text: `Trang bị phong phú nhất (${maxFeatures} tiện nghi)`,
        short: `${maxFeatures} tiện nghi`,
        color: 'violet',
      })
    }
    if (car.conditionGrade === 'A') {
      highlights.push({
        type: 'grade',
        text: 'Tình trạng hạng A – Rất tốt',
        short: 'Hạng A – Rất tốt',
        color: 'gold',
      })
    }

    if (highlights.length === 0) {
      highlights.push({
        type: 'balanced',
        text: `Lựa chọn cân bằng trong phân khúc ${labelFor(BODY_TYPE_LABEL, car.bodyType)}`,
        short: 'Cấu hình cân bằng',
        color: 'cyan',
      })
    }

    return {
      id: car._id,
      car,
      title: titleOfCar(car),
      theme,
      marketSavings,
      scores: {
        overall: overallScore,
        value: valueScore,
        condition: conditionScore,
        performance: performanceScore,
        economy: economyScore,
        comfort: comfortScore,
      },
      highlights,
      winCount: highlights.length,
    }
  })

  const maxOverall = Math.max(...results.map((r) => r.scores.overall))
  return results.map((r) => ({
    ...r,
    isTopOverall: r.scores.overall === maxOverall,
  }))
}

export const PERSONA_MODES = [
  {
    key: 'overall',
    label: 'Toàn diện nhất',
    badge: 'AI SMART PICK',
    desc: 'Cân bằng hoàn hảo giữa giá bán, độ mới, vận hành và trang bị tiện nghi.',
    weights: { value: 0.25, condition: 0.25, performance: 0.18, economy: 0.16, comfort: 0.16 },
  },
  {
    key: 'economy',
    label: 'Kinh tế & Tiết kiệm',
    badge: 'TỐI ƯU TÀI CHÍNH',
    desc: 'Ưu tiên mức giá hợp lý nhất, tiết kiệm nhiên liệu và chi phí sử dụng lâu dài.',
    weights: { value: 0.45, economy: 0.35, condition: 0.12, comfort: 0.04, performance: 0.04 },
  },
  {
    key: 'performance',
    label: 'Mạnh mẽ & Cảm giác lái',
    badge: 'ĐỘNG CƠ VƯỢT TRỘI',
    desc: 'Ưu tiên công suất mã lực, mô-men xoắn và khả năng tăng tốc ấn tượng.',
    weights: { performance: 0.55, condition: 0.18, comfort: 0.12, value: 0.08, economy: 0.07 },
  },
  {
    key: 'family',
    label: 'Gia đình & Tiện nghi',
    badge: 'AN TOÀN & RỘNG RÃI',
    desc: 'Ưu tiên không gian chỗ ngồi, đánh giá an toàn và danh sách tiện nghi đầy đủ.',
    weights: { comfort: 0.52, condition: 0.2, economy: 0.12, value: 0.1, performance: 0.06 },
  },
  {
    key: 'likenew',
    label: 'Xe lướt như mới',
    badge: 'ĐỘ MỚI CAO NHẤT',
    desc: 'Ưu tiên xe đời cao, số Odo thấp nhất và phân hạng tình trạng A/B xuất sắc.',
    weights: { condition: 0.62, comfort: 0.14, value: 0.1, performance: 0.07, economy: 0.07 },
  },
]

/**
 * Tạo gợi ý xe chiến thắng theo từng nhu cầu (Persona) của khách hàng.
 */
export function buildPersonaRecommendations(analysisList) {
  if (!Array.isArray(analysisList) || analysisList.length === 0) return {}

  const output = {}
  PERSONA_MODES.forEach((persona) => {
    const ranked = analysisList
      .map((item) => {
        const w = persona.weights
        const matchScore = Math.min(
          99,
          Math.round(
            item.scores.value * w.value +
              item.scores.condition * w.condition +
              item.scores.performance * w.performance +
              item.scores.economy * w.economy +
              item.scores.comfort * w.comfort,
          ),
        )
        return { ...item, matchScore }
      })
      .sort((a, b) => b.matchScore - a.matchScore)

    output[persona.key] = {
      persona,
      winner: ranked[0],
      runnerUp: ranked[1] ?? null,
      ranked,
    }
  })

  return output
}

/**
 * Chấm điểm và gợi ý các xe tương tự từ kho xe để người dùng thêm hoặc đổi xe so sánh.
 */
export function recommendSimilarCars(currentCars, poolCars, limit = 4) {
  const current = Array.isArray(currentCars) ? currentCars : []
  const pool = Array.isArray(poolCars) ? poolCars : []
  const selectedIds = new Set(current.map((c) => String(c._id || c.id).toLowerCase()))

  const candidates = pool.filter((c) => c?._id && !selectedIds.has(String(c._id).toLowerCase()))
  if (candidates.length === 0) return []

  const avgPrice =
    current.length > 0
      ? current.reduce((sum, c) => sum + (Number(c.price) || 0), 0) / current.length
      : 0
  const bodyTypes = new Set(current.map((c) => c.bodyType).filter(Boolean))
  const makes = new Set(current.map((c) => c.make).filter(Boolean))

  const scored = candidates.map((car) => {
    let score = 50
    let reasonTag = 'Đáng cân nhắc'
    let reasonColor = 'cyan'

    const sameBody = car.bodyType && bodyTypes.has(car.bodyType)
    const priceDiffRatio =
      avgPrice > 0 && car.price ? Math.abs(car.price - avgPrice) / avgPrice : 1

    if (sameBody && priceDiffRatio <= 0.25) {
      score += 42
      reasonTag = `Đối thủ ${labelFor(BODY_TYPE_LABEL, car.bodyType)} cùng tầm giá`
      reasonColor = 'gold'
    } else if (sameBody) {
      score += 28
      reasonTag = `Cùng phân khúc ${labelFor(BODY_TYPE_LABEL, car.bodyType)}`
      reasonColor = 'cyan'
    } else if (priceDiffRatio <= 0.2) {
      score += 32
      reasonTag = 'Cùng tầm ngân sách'
      reasonColor = 'emerald'
    } else if (car.make && makes.has(car.make)) {
      score += 20
      reasonTag = `Cùng thương hiệu ${car.make}`
      reasonColor = 'violet'
    } else if (car.price && avgPrice > 0 && car.price < avgPrice) {
      score += 18
      reasonTag = 'Lựa chọn tiết kiệm ngân sách'
      reasonColor = 'emerald'
    }

    if (car.year >= 2022) score += 6
    if (car.conditionGrade === 'A') score += 5

    return {
      car,
      score,
      reasonTag,
      reasonColor,
      fuelLabel: labelFor(FUEL_TYPE_LABEL, car.fuelType),
      bodyLabel: labelFor(BODY_TYPE_LABEL, car.bodyType),
    }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Tạo các cặp đấu (Battle Matchups) gợi ý sẵn khi người dùng chưa chọn đủ 2 xe.
 */
export function buildSuggestedMatchups(poolCars, maxPairs = 3) {
  const pool = Array.isArray(poolCars) ? poolCars.filter((c) => c?._id) : []
  if (pool.length < 2) return []

  const pairs = []
  const usedPairKeys = new Set()

  // Ưu tiên ghép các xe cùng bodyType hoặc gần tầm giá
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i]
      const b = pool[j]
      const key = [a._id, b._id].sort().join(':')
      if (usedPairKeys.has(key)) continue

      const sameBody = a.bodyType && a.bodyType === b.bodyType
      const avg = ((Number(a.price) || 0) + (Number(b.price) || 0)) / 2
      const priceDiff = avg > 0 ? Math.abs((a.price || 0) - (b.price || 0)) / avg : 1

      let score = 40
      let tag = 'Cặp đấu tâm điểm'
      if (sameBody && priceDiff <= 0.3) {
        score = 95
        tag = `Đại chiến ${labelFor(BODY_TYPE_LABEL, a.bodyType)} cùng tầm giá`
      } else if (sameBody) {
        score = 80
        tag = `So găng phân khúc ${labelFor(BODY_TYPE_LABEL, a.bodyType)}`
      } else if (priceDiff <= 0.2) {
        score = 85
        tag = 'Đối đầu cùng tầm ngân sách'
      }

      usedPairKeys.add(key)
      pairs.push({
        id: key,
        tag,
        score,
        cars: [a, b],
      })
    }
  }

  return pairs.sort((x, y) => y.score - x.score).slice(0, maxPairs)
}
