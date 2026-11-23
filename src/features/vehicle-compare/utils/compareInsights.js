// Phân tích thông số thực tế, tạo highlight đối chiếu khách quan và hỗ trợ gợi ý tham khảo từ AI cho trang so sánh xe.
// Không chấm điểm giả lập (/100), không tính % độ phù hợp ảo và không vẽ thanh điểm vô căn cứ.

import { formatPrice, formatMileage } from '../../../utils/format'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, labelFor } from '../constants/compareLabels'
import { isDifferent } from './compareRows'

export const AI_DISCLAIMER_TEXT =
  'Lưu ý: Nội dung phân tích và gợi ý trên được tạo tự động bởi AI chỉ nhằm mục đích tham khảo nhanh dựa trên thông số niêm yết. AI có thể sai sót hoặc chưa phản ánh hết tình trạng thực tế — quý khách vui lòng đối chiếu bảng thông số kỹ thuật chi tiết và đặt lịch xem xe/lái thử trực tiếp tại Showroom TrustCar.'

export const CAR_LED_THEMES = [
  {
    key: 'champagne',
    name: 'Champagne Gold',
    badge: 'XE #1',
    primary: '#c9a227',
    glow: '#e5c878',
    softBg: 'rgba(201, 162, 39, 0.10)',
    border: 'rgba(201, 162, 39, 0.42)',
    gradient: 'linear-gradient(90deg, #b8911b 0%, #e5c878 100%)',
  },
  {
    key: 'platinum',
    name: 'Platinum Daylight',
    badge: 'XE #2',
    primary: '#6488a8',
    glow: '#9cc0de',
    softBg: 'rgba(100, 136, 168, 0.10)',
    border: 'rgba(148, 184, 218, 0.38)',
    gradient: 'linear-gradient(90deg, #527594 0%, #9cc0de 100%)',
  },
  {
    key: 'emerald',
    name: 'Titanium Sage',
    badge: 'XE #3',
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
  },
  horsePower: {
    getter: (c) => numOrNull(c.specifications?.horsePower),
    mode: 'max',
    winnerLabel: 'Mã lực mạnh nhất',
    color: 'orange',
  },
  torqueNm: {
    getter: (c) => numOrNull(c.specifications?.torqueNm),
    mode: 'max',
    winnerLabel: 'Lực kéo cao nhất',
    color: 'violet',
  },
  fuelConsumption: {
    getter: (c) => numOrNull(c.specifications?.fuelConsumption),
    mode: 'min',
    winnerLabel: 'Tiết kiệm nhất',
    color: 'emerald',
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
 * Làm giàu dữ liệu hàng bảng so sánh với trạng thái khác biệt, thông số vượt trội thực tế
 * và tiện nghi riêng biệt (không tạo thanh bar % vô nghĩa).
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
      if (rule && validValues.length >= 2 && hasDiff && new Set(validValues).size > 1) {
        bestVal = rule.mode === 'max' ? Math.max(...validValues) : Math.min(...validValues)
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

export const titleOfCar = (car) =>
  [car?.make, car?.model, car?.variant].filter(Boolean).join(' ') || 'Xe TrustCar'

/**
 * Tổng hợp các điểm nổi bật thực tế (Fact-based highlights) từ số liệu niêm yết của từng xe.
 * Hoàn toàn không tự chấm điểm (/100) hay áp đặt xe chiến thắng tổng thể.
 */
export function analyzeCars(cars) {
  const list = Array.isArray(cars) ? cars : []
  if (list.length === 0) return []

  const prices = list.map((c) => numOrNull(c.price))
  const years = list.map((c) => numOrNull(c.year))
  const mileages = list.map((c) => (typeof c.mileage === 'number' && c.mileage >= 0 ? c.mileage : null))
  const hps = list.map((c) => numOrNull(c.specifications?.horsePower))
  const fuels = list.map((c) => numOrNull(c.specifications?.fuelConsumption))
  const featureCounts = list.map((c) =>
    Array.isArray(c.specifications?.features) ? c.specifications.features.length : 0,
  )

  const validPrices = prices.filter(Boolean)
  const minPrice = validPrices.length >= 2 ? Math.min(...validPrices) : null
  const maxPrice = validPrices.length >= 2 ? Math.max(...validPrices) : null

  const validYears = years.filter(Boolean)
  const maxYear = validYears.length >= 2 ? Math.max(...validYears) : null

  const validMileages = mileages.filter((v) => v != null)
  const minMileage = validMileages.length >= 2 ? Math.min(...validMileages) : null

  const validHps = hps.filter(Boolean)
  const maxHp = validHps.length >= 2 ? Math.max(...validHps) : null

  const validFuels = fuels.filter(Boolean)
  const minFuel = validFuels.length >= 2 ? Math.min(...validFuels) : null

  const maxFeatures = Math.max(...featureCounts)
  const minFeatures = Math.min(...featureCounts)

  return list.map((car, idx) => {
    const theme = CAR_LED_THEMES[idx % CAR_LED_THEMES.length]

    const marketSavings =
      numOrNull(car.marketPrice) && numOrNull(car.price) && car.marketPrice > car.price
        ? car.marketPrice - car.price
        : 0

    const highlights = []
    if (minPrice != null && maxPrice !== minPrice && car.price === minPrice) {
      const diff = maxPrice - minPrice
      highlights.push({
        type: 'price',
        text: `Giá thấp nhất nhóm (chênh ${formatPrice(diff)})`,
        short: 'Giá thấp nhất',
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
    if (maxYear != null && new Set(validYears).size > 1 && car.year === maxYear) {
      highlights.push({
        type: 'year',
        text: `Đời xe mới nhất (${car.year})`,
        short: `Đời mới nhất (${car.year})`,
        color: 'cyan',
      })
    }
    if (minMileage != null && new Set(validMileages).size > 1 && car.mileage === minMileage) {
      highlights.push({
        type: 'mileage',
        text: `Odo thấp nhất (${formatMileage(car.mileage)})`,
        short: 'Odo thấp nhất',
        color: 'cyan',
      })
    }
    if (maxHp != null && new Set(validHps).size > 1 && car.specifications?.horsePower === maxHp) {
      highlights.push({
        type: 'power',
        text: `Công suất cao nhất (${maxHp} HP)`,
        short: `${maxHp} HP cao nhất`,
        color: 'orange',
      })
    }
    if (minFuel != null && new Set(validFuels).size > 1 && car.specifications?.fuelConsumption === minFuel) {
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
        text: `Nhiều trang bị nhất (${maxFeatures} tiện nghi)`,
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

    return {
      id: car._id,
      car,
      title: titleOfCar(car),
      theme,
      marketSavings,
      highlights,
    }
  })
}

export const AI_PREFERENCE_MODES = [
  {
    key: 'overall',
    label: 'Tổng quan cân bằng',
    desc: 'Đối chiếu toàn diện giữa giá bán, đời xe, số Odo, vận hành và trang bị tiện nghi.',
  },
  {
    key: 'economy',
    label: 'Kinh tế & Tiết kiệm',
    desc: 'Tập trung vào mức giá đầu tư ban đầu và mức tiêu hao nhiên liệu công bố.',
  },
  {
    key: 'family',
    label: 'Gia đình & Tiện nghi',
    desc: 'Tập trung vào không gian chỗ ngồi, đánh giá an toàn và danh sách tiện nghi.',
  },
  {
    key: 'performance',
    label: 'Vận hành & Cảm giác lái',
    desc: 'Tập trung vào công suất động cơ (HP), mô-men xoắn (Nm), hộp số và hệ dẫn động.',
  },
  {
    key: 'likenew',
    label: 'Xe lướt & Độ mới',
    desc: 'Tập trung vào năm sản xuất đời cao, số km đã đi (Odo) thấp và phân hạng tình trạng.',
  },
]

// Giữ alias PERSONA_MODES để tương thích ngược nếu cần
export const PERSONA_MODES = AI_PREFERENCE_MODES

/**
 * Dựng dữ liệu phân tích đối chiếu dự phòng tại client dựa trên 100% thông số thật
 * (dùng khi mất kết nối mạng hoặc làm fallback tức thì, hoàn toàn không có điểm số / % phù hợp).
 */
export function buildLocalAiFallbackInsight(cars, preference = 'overall') {
  const list = Array.isArray(cars) ? cars : []
  const pref = AI_PREFERENCE_MODES.find((m) => m.key === preference) ?? AI_PREFERENCE_MODES[0]
  if (list.length === 0) return null

  const analysis = analyzeCars(list)
  const prices = list.map((c) => numOrNull(c.price)).filter(Boolean)
  const minPrice = prices.length >= 2 ? Math.min(...prices) : null
  const maxPrice = prices.length >= 2 ? Math.max(...prices) : null

  const featureSets = list.map((c) => new Set(Array.isArray(c.specifications?.features) ? c.specifications.features : []))
  const sharedFeatures =
    featureSets.length >= 2
      ? [...featureSets[0]].filter((item) => featureSets.every((s) => s.has(item)))
      : []

  const carInsights = analysis.map((item, idx) => {
    const c = item.car
    const specs = c.specifications ?? {}
    const strengths = item.highlights.map((h) => h.text)
    const considerations = []

    const uniqueFeats = (Array.isArray(specs.features) ? specs.features : []).filter(
      (f) => !sharedFeatures.includes(f),
    )
    if (uniqueFeats.length > 0) {
      strengths.push(`Có thêm trang bị riêng: ${uniqueFeats.slice(0, 4).join(', ')}.`)
    }

    if (minPrice != null && maxPrice !== minPrice && numOrNull(c.price) && c.price > minPrice) {
      considerations.push(
        `Giá niêm yết cao hơn ${formatPrice(c.price - minPrice)} so với mẫu xe có giá thấp nhất trong bàn cân.`,
      )
    }

    const missing = []
    if (!numOrNull(specs.horsePower)) missing.push('công suất')
    if (!numOrNull(specs.fuelConsumption)) missing.push('mức tiêu hao nhiên liệu')
    if (!specs.safetyRating) missing.push('đánh giá an toàn')
    if (missing.length > 0) {
      considerations.push(
        `Thông số ${missing.join(', ')} hiện "Chưa cập nhật" — nên kiểm tra thực tế tại showroom.`,
      )
    }

    if (strengths.length === 0) {
      strengths.push(
        `Cấu hình ${labelFor(BODY_TYPE_LABEL, c.bodyType)}, nhiên liệu ${labelFor(FUEL_TYPE_LABEL, c.fuelType).toLowerCase()} với mức giá ${formatPrice(c.price)}.`,
      )
    }
    if (considerations.length === 0) {
      considerations.push(
        'Nên đặt lịch xem xe và lái thử trực tiếp để đánh giá độ cách âm, cảm giác lái và nội thất thực tế.',
      )
    }

    return {
      carId: String(c._id ?? idx),
      carTitle: `${item.title}${c.year ? ` (${c.year})` : ''}`,
      strengths,
      considerations,
      bestFor:
        item.highlights.length > 0
          ? `Đáng cân nhắc nếu bạn ưu tiên: ${item.highlights.map((h) => h.short.toLowerCase()).join(', ')}.`
          : `Phù hợp nếu bạn ưa chuộng dòng ${item.title} trong tầm giá ${formatPrice(c.price)}.`,
    }
  })

  const names = analysis.map((a) => a.title).join(' và ')
  const priceText =
    minPrice != null && maxPrice != null && minPrice !== maxPrice
      ? `chênh lệch giá niêm yết khoảng ${formatPrice(maxPrice - minPrice)}`
      : 'mức giá niêm yết tương đương nhau'

  return {
    preference: pref.key,
    preferenceLabel: pref.label,
    summary: `Đối chiếu nhanh giữa ${names}: các mẫu xe có ${priceText}. Mỗi lựa chọn có ưu thế riêng về năm sản xuất, số km đã đi (Odo) hoặc danh sách tiện nghi đi kèm.`,
    recommendation: `Theo góc nhìn "${pref.label}": Không có mẫu xe nào thắng tuyệt đối ở mọi tiêu chí. Bạn nên đối chiếu các điểm mạnh/đánh đổi của từng xe bên dưới với ngân sách thực tế và đặt lịch lái thử trực tiếp tại Showroom.`,
    carInsights,
    missingDataNote: null,
    disclaimer: AI_DISCLAIMER_TEXT,
    source: 'local-fallback',
  }
}

/**
 * Gợi ý các xe tương tự từ kho xe để người dùng thêm hoặc đổi xe so sánh.
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
    let rankPriority = 1
    let reasonTag = 'Đáng cân nhắc'
    let reasonColor = 'cyan'

    const sameBody = car.bodyType && bodyTypes.has(car.bodyType)
    const priceDiffRatio =
      avgPrice > 0 && car.price ? Math.abs(car.price - avgPrice) / avgPrice : 1

    if (sameBody && priceDiffRatio <= 0.25) {
      rankPriority = 5
      reasonTag = `Đối thủ ${labelFor(BODY_TYPE_LABEL, car.bodyType)} cùng tầm giá`
      reasonColor = 'gold'
    } else if (priceDiffRatio <= 0.2) {
      rankPriority = 4
      reasonTag = 'Cùng tầm ngân sách'
      reasonColor = 'emerald'
    } else if (sameBody) {
      rankPriority = 3
      reasonTag = `Cùng phân khúc ${labelFor(BODY_TYPE_LABEL, car.bodyType)}`
      reasonColor = 'cyan'
    } else if (car.make && makes.has(car.make)) {
      rankPriority = 2
      reasonTag = `Cùng thương hiệu ${car.make}`
      reasonColor = 'violet'
    } else if (car.price && avgPrice > 0 && car.price < avgPrice) {
      rankPriority = 2
      reasonTag = 'Lựa chọn tiết kiệm ngân sách'
      reasonColor = 'emerald'
    }

    return {
      car,
      rankPriority,
      reasonTag,
      reasonColor,
      fuelLabel: labelFor(FUEL_TYPE_LABEL, car.fuelType),
      bodyLabel: labelFor(BODY_TYPE_LABEL, car.bodyType),
    }
  })

  return scored.sort((a, b) => b.rankPriority - a.rankPriority).slice(0, limit)
}

/**
 * Tạo các cặp đấu (Battle Matchups) gợi ý sẵn khi người dùng chưa chọn đủ 2 xe.
 */
export function buildSuggestedMatchups(poolCars, maxPairs = 3) {
  const pool = Array.isArray(poolCars) ? poolCars.filter((c) => c?._id) : []
  if (pool.length < 2) return []

  const pairs = []
  const usedPairKeys = new Set()

  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i]
      const b = pool[j]
      const key = [a._id, b._id].sort().join(':')
      if (usedPairKeys.has(key)) continue

      const sameBody = a.bodyType && a.bodyType === b.bodyType
      const avg = ((Number(a.price) || 0) + (Number(b.price) || 0)) / 2
      const priceDiff = avg > 0 ? Math.abs((a.price || 0) - (b.price || 0)) / avg : 1

      let priority = 1
      let tag = 'Cặp đấu tâm điểm'
      if (sameBody && priceDiff <= 0.3) {
        priority = 4
        tag = `Đại chiến ${labelFor(BODY_TYPE_LABEL, a.bodyType)} cùng tầm giá`
      } else if (priceDiff <= 0.2) {
        priority = 3
        tag = 'Đối đầu cùng tầm ngân sách'
      } else if (sameBody) {
        priority = 2
        tag = `So găng phân khúc ${labelFor(BODY_TYPE_LABEL, a.bodyType)}`
      }

      usedPairKeys.add(key)
      pairs.push({
        id: key,
        tag,
        priority,
        cars: [a, b],
      })
    }
  }

  return pairs.sort((x, y) => y.priority - x.priority).slice(0, maxPairs)
}
