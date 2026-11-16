import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL } from './constants'

export const RECENT_SEARCHES_KEY = 'trustcar_recent_searches_v1'

export function normalizeSearchText(text = '') {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeCompactToken(text = '') {
  return normalizeSearchText(text).replace(/[-\s._]/g, '')
}

export const KNOWN_BRANDS = [
  { make: 'TOYOTA', label: 'Toyota', aliases: ['toyota'] },
  { make: 'MAZDA', label: 'Mazda', aliases: ['mazda'] },
  { make: 'HONDA', label: 'Honda', aliases: ['honda'] },
  { make: 'HYUNDAI', label: 'Hyundai', aliases: ['hyundai', 'huyndai'] },
  { make: 'KIA', label: 'Kia', aliases: ['kia'] },
  { make: 'FORD', label: 'Ford', aliases: ['ford'] },
  { make: 'VINFAST', label: 'VinFast', aliases: ['vinfast', 'vin fast'] },
  { make: 'MITSUBISHI', label: 'Mitsubishi', aliases: ['mitsubishi', 'mitsu'] },
  { make: 'MERCEDES-BENZ', label: 'Mercedes-Benz', aliases: ['mercedes-benz', 'mercedes', 'merc', 'mer'] },
  { make: 'PEUGEOT', label: 'Peugeot', aliases: ['peugeot'] },
  { make: 'BMW', label: 'BMW', aliases: ['bmw'] },
  { make: 'LEXUS', label: 'Lexus', aliases: ['lexus'] },
  { make: 'AUDI', label: 'Audi', aliases: ['audi'] },
  { make: 'SUZUKI', label: 'Suzuki', aliases: ['suzuki'] },
  { make: 'NISSAN', label: 'Nissan', aliases: ['nissan'] },
  { make: 'MG', label: 'MG', aliases: ['mg'] },
  { make: 'SUBARU', label: 'Subaru', aliases: ['subaru'] },
]

export const KNOWN_MODELS = [
  { model: 'Camry', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'SEDAN', aliases: ['camry'] },
  { model: 'Corolla Cross', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'SUV', aliases: ['corolla cross', 'cross'] },
  { model: 'Vios', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'SEDAN', aliases: ['vios'] },
  { model: 'Fortuner', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'SUV', aliases: ['fortuner'] },
  { model: 'Innova', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'MPV', aliases: ['innova', 'innova cross'] },
  { model: 'Veloz', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'MPV', aliases: ['veloz', 'veloz cross'] },
  { model: 'Raize', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'SUV', aliases: ['raize'] },
  { model: 'Yaris', make: 'TOYOTA', brandLabel: 'Toyota', bodyType: 'HATCHBACK', aliases: ['yaris', 'yaris cross'] },
  { model: 'CX-5', make: 'MAZDA', brandLabel: 'Mazda', bodyType: 'SUV', aliases: ['cx-5', 'cx5', 'cx 5'] },
  { model: 'CX-8', make: 'MAZDA', brandLabel: 'Mazda', bodyType: 'SUV', aliases: ['cx-8', 'cx8', 'cx 8'] },
  { model: 'CX-3', make: 'MAZDA', brandLabel: 'Mazda', bodyType: 'SUV', aliases: ['cx-3', 'cx3', 'cx 3'] },
  { model: 'CX-30', make: 'MAZDA', brandLabel: 'Mazda', bodyType: 'SUV', aliases: ['cx-30', 'cx30', 'cx 30'] },
  { model: 'Mazda3', make: 'MAZDA', brandLabel: 'Mazda', bodyType: 'SEDAN', aliases: ['mazda 3', 'mazda3', 'm3'] },
  { model: 'Mazda6', make: 'MAZDA', brandLabel: 'Mazda', bodyType: 'SEDAN', aliases: ['mazda 6', 'mazda6', 'm6'] },
  { model: 'CR-V', make: 'HONDA', brandLabel: 'Honda', bodyType: 'SUV', aliases: ['cr-v', 'crv', 'cr v'] },
  { model: 'HR-V', make: 'HONDA', brandLabel: 'Honda', bodyType: 'SUV', aliases: ['hr-v', 'hrv', 'hr v'] },
  { model: 'Civic', make: 'HONDA', brandLabel: 'Honda', bodyType: 'SEDAN', aliases: ['civic'] },
  { model: 'City', make: 'HONDA', brandLabel: 'Honda', bodyType: 'SEDAN', aliases: ['city'] },
  { model: 'Accord', make: 'HONDA', brandLabel: 'Honda', bodyType: 'SEDAN', aliases: ['accord'] },
  { model: 'BR-V', make: 'HONDA', brandLabel: 'Honda', bodyType: 'MPV', aliases: ['br-v', 'brv', 'br v'] },
  { model: 'Tucson', make: 'HYUNDAI', brandLabel: 'Hyundai', bodyType: 'SUV', aliases: ['tucson'] },
  { model: 'Santa Fe', make: 'HYUNDAI', brandLabel: 'Hyundai', bodyType: 'SUV', aliases: ['santa fe', 'santafe'] },
  { model: 'Accent', make: 'HYUNDAI', brandLabel: 'Hyundai', bodyType: 'SEDAN', aliases: ['accent'] },
  { model: 'Creta', make: 'HYUNDAI', brandLabel: 'Hyundai', bodyType: 'SUV', aliases: ['creta'] },
  { model: 'Elantra', make: 'HYUNDAI', brandLabel: 'Hyundai', bodyType: 'SEDAN', aliases: ['elantra'] },
  { model: 'Grand i10', make: 'HYUNDAI', brandLabel: 'Hyundai', bodyType: 'HATCHBACK', aliases: ['i10', 'grand i10'] },
  { model: 'Seltos', make: 'KIA', brandLabel: 'Kia', bodyType: 'SUV', aliases: ['seltos'] },
  { model: 'Sonet', make: 'KIA', brandLabel: 'Kia', bodyType: 'SUV', aliases: ['sonet'] },
  { model: 'Carnival', make: 'KIA', brandLabel: 'Kia', bodyType: 'MPV', aliases: ['carnival', 'sedona'] },
  { model: 'Sorento', make: 'KIA', brandLabel: 'Kia', bodyType: 'SUV', aliases: ['sorento'] },
  { model: 'K3', make: 'KIA', brandLabel: 'Kia', bodyType: 'SEDAN', aliases: ['k3', 'cerato'] },
  { model: 'Morning', make: 'KIA', brandLabel: 'Kia', bodyType: 'HATCHBACK', aliases: ['morning'] },
  { model: 'Ranger', make: 'FORD', brandLabel: 'Ford', bodyType: 'PICKUP', aliases: ['ranger', 'wildtrak', 'raptor'] },
  { model: 'Everest', make: 'FORD', brandLabel: 'Ford', bodyType: 'SUV', aliases: ['everest'] },
  { model: 'Territory', make: 'FORD', brandLabel: 'Ford', bodyType: 'SUV', aliases: ['territory'] },
  { model: 'VF 5', make: 'VINFAST', brandLabel: 'VinFast', bodyType: 'SUV', aliases: ['vf 5', 'vf5'] },
  { model: 'VF 6', make: 'VINFAST', brandLabel: 'VinFast', bodyType: 'SUV', aliases: ['vf 6', 'vf6'] },
  { model: 'VF 7', make: 'VINFAST', brandLabel: 'VinFast', bodyType: 'SUV', aliases: ['vf 7', 'vf7'] },
  { model: 'VF 8', make: 'VINFAST', brandLabel: 'VinFast', bodyType: 'SUV', aliases: ['vf 8', 'vf8'] },
  { model: 'VF 9', make: 'VINFAST', brandLabel: 'VinFast', bodyType: 'SUV', aliases: ['vf 9', 'vf9'] },
  { model: 'Fadil', make: 'VINFAST', brandLabel: 'VinFast', bodyType: 'HATCHBACK', aliases: ['fadil'] },
  { model: 'Xpander', make: 'MITSUBISHI', brandLabel: 'Mitsubishi', bodyType: 'MPV', aliases: ['xpander'] },
  { model: 'Outlander', make: 'MITSUBISHI', brandLabel: 'Mitsubishi', bodyType: 'SUV', aliases: ['outlander'] },
  { model: 'Xforce', make: 'MITSUBISHI', brandLabel: 'Mitsubishi', bodyType: 'SUV', aliases: ['xforce'] },
  { model: 'GLC 300', make: 'MERCEDES-BENZ', brandLabel: 'Mercedes-Benz', bodyType: 'SUV', aliases: ['glc', 'glc 300', 'glc 200', 'glc300', 'glc200'] },
  { model: 'C200', make: 'MERCEDES-BENZ', brandLabel: 'Mercedes-Benz', bodyType: 'SEDAN', aliases: ['c200', 'c300', 'e200', 'e300'] },
  { model: '3008', make: 'PEUGEOT', brandLabel: 'Peugeot', bodyType: 'SUV', aliases: ['3008', '5008', '2008'] },
]

export const QUICK_SEARCH_PRESETS = [
  {
    id: 'preset-suv',
    label: 'SUV gầm cao',
    subLabel: 'Kiểu dáng ưa chuộng',
    category: 'body',
    params: { bodyType: 'SUV' },
  },
  {
    id: 'preset-sedan',
    label: 'Sedan đi phố',
    subLabel: 'Kiểu dáng lịch lãm',
    category: 'body',
    params: { bodyType: 'SEDAN' },
  },
  {
    id: 'preset-under-500',
    label: 'Xe dưới 500 triệu',
    subLabel: 'Ngân sách tiết kiệm',
    category: 'budget',
    params: { priceMin: '0', priceMax: '500000000' },
  },
  {
    id: 'preset-500-1000',
    label: 'Từ 500 triệu - 1 tỷ',
    subLabel: 'Phân khúc bán chạy',
    category: 'budget',
    params: { priceMin: '500000000', priceMax: '1000000000' },
  },
  {
    id: 'preset-cx5',
    label: 'Mazda CX-5',
    subLabel: 'SUV 5 chỗ nổi bật',
    category: 'model',
    params: { make: 'MAZDA', search: 'CX-5' },
  },
  {
    id: 'preset-camry',
    label: 'Toyota Camry',
    subLabel: 'Sedan hạng D cao cấp',
    category: 'model',
    params: { make: 'TOYOTA', search: 'Camry' },
  },
  {
    id: 'preset-crv',
    label: 'Honda CR-V',
    subLabel: 'SUV 7 chỗ gia đình',
    category: 'model',
    params: { make: 'HONDA', search: 'CR-V' },
  },
  {
    id: 'preset-ranger',
    label: 'Ford Ranger',
    subLabel: 'Vua bán tải mạnh mẽ',
    category: 'model',
    params: { make: 'FORD', search: 'Ranger' },
  },
]

function toVnd(rawAmount, rawUnit = '') {
  const num = parseFloat(String(rawAmount).replace(',', '.'))
  if (!Number.isFinite(num) || num <= 0) return null
  const unit = normalizeSearchText(rawUnit)
  if (unit.startsWith('ty') || unit.startsWith('ti') || num < 20) {
    return Math.round(num * 1_000_000_000)
  }
  return Math.round(num * 1_000_000)
}

function formatShortPrice(vnd) {
  if (!vnd) return ''
  if (vnd >= 1_000_000_000) {
    const b = Math.floor(vnd / 1_000_000_000)
    const m = Math.round((vnd % 1_000_000_000) / 1_000_000)
    return m > 0 ? `${b} tỷ ${m} tr` : `${b} tỷ`
  }
  return `${Math.round(vnd / 1_000_000)} triệu`
}

/**
 * Phân tích câu tìm kiếm tiếng Việt tự nhiên thành bộ lọc có cấu trúc + từ khóa sạch.
 * Ví dụ:
 *   "Mazda CX5 dưới 800 triệu" -> { make: 'MAZDA', model: 'CX-5', cleanSearch: 'CX-5', priceMax: 800000000, recognizedTags: [...] }
 *   "SUV 7 chỗ máy dầu 2022"   -> { bodyType: 'SUV', fuelType: 'DIESEL', yearMin: 2022, yearMax: 2022, recognizedTags: [...] }
 */
export function parseSmartSearchQuery(rawQuery = '') {
  const original = String(rawQuery || '').trim()
  if (!original) {
    return {
      original: '',
      cleanSearch: '',
      recognizedTags: [],
      hasStructuredFilters: false,
    }
  }

  let working = original
  let norm = normalizeSearchText(working)

  const parsed = {
    original,
    make: undefined,
    model: undefined,
    bodyType: undefined,
    fuelType: undefined,
    transmission: undefined,
    yearMin: undefined,
    yearMax: undefined,
    priceMin: undefined,
    priceMax: undefined,
    mileageMax: undefined,
    cleanSearch: '',
    recognizedTags: [],
    hasStructuredFilters: false,
  }

  // 1. Nhận diện khoảng giá trong câu tìm kiếm ("dưới 700 triệu", "500 - 800tr", "dưới 1 tỷ 2", "tầm 600tr")
  const compoundPriceNorm = norm.replace(
    /(\d+)\s*(?:ty|ti)\s*(\d{1,3})\b/g,
    (_m, b, m) => {
      const dec = String(m).length === 1 ? Number(m) / 10 : Number(m) / 1000
      return `${Number(b) + dec} ty`
    }
  )

  const rangeMatch = compoundPriceNorm.match(
    /(?:tu|khoang|tam)?\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr|cu)?\s*(?:den|-|toi|~)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr|cu)\b/
  )
  const underMatch = !rangeMatch
    ? compoundPriceNorm.match(
        /(?:duoi|nho hon|toi da|khong qua|<|<=)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr|cu)\b/
      )
    : null
  const overMatch =
    !rangeMatch && !underMatch
      ? compoundPriceNorm.match(/(?:tren|hon|tu|>|>=)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr|cu)\b/)
      : null
  const approxMatch =
    !rangeMatch && !underMatch && !overMatch
      ? compoundPriceNorm.match(/(?:tam|khoang|gia|tai chinh|ngan sach)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr|cu)\b/)
      : null

  if (rangeMatch) {
    const u2 = rangeMatch[4]
    const u1 = rangeMatch[2] || u2
    const min = toVnd(rangeMatch[1], u1)
    const max = toVnd(rangeMatch[3], u2)
    if (min && max) {
      parsed.priceMin = Math.min(min, max)
      parsed.priceMax = Math.max(min, max)
      parsed.recognizedTags.push({
        key: 'price',
        label: `Giá: ${formatShortPrice(parsed.priceMin)} - ${formatShortPrice(parsed.priceMax)}`,
      })
      working = working.replace(
        /(?:từ|tu|khoảng|khoang|tầm|tam)?\s*\d+(?:[.,]\d+)?\s*(?:tỷ|ty|tỉ|ti|triệu|trieu|tr|củ|cu)?\s*(?:đến|den|-|tới|toi|~)\s*\d+(?:[.,]\d+)?\s*(?:tỷ|ty|tỉ|ti|triệu|trieu|tr|củ|cu)(?:\s*\d{1,3})?/gi,
        ' '
      )
    }
  } else if (underMatch) {
    const max = toVnd(underMatch[1], underMatch[2])
    if (max) {
      parsed.priceMax = max
      parsed.recognizedTags.push({
        key: 'price',
        label: `Giá: Dưới ${formatShortPrice(max)}`,
      })
      working = working.replace(
        /(?:dưới|duoi|nhỏ hơn|nho hon|tối đa|toi da|không quá|khong qua|<|<=)\s*\d+(?:[.,]\d+)?\s*(?:tỷ|ty|tỉ|ti|triệu|trieu|tr|củ|cu)(?:\s*\d{1,3})?/gi,
        ' '
      )
    }
  } else if (overMatch) {
    const min = toVnd(overMatch[1], overMatch[2])
    if (min) {
      parsed.priceMin = min
      parsed.recognizedTags.push({
        key: 'price',
        label: `Giá: Trên ${formatShortPrice(min)}`,
      })
      working = working.replace(
        /(?:trên|tren|hơn|hon|từ|tu|>|>=)\s*\d+(?:[.,]\d+)?\s*(?:tỷ|ty|tỉ|ti|triệu|trieu|tr|củ|cu)(?:\s*\d{1,3})?/gi,
        ' '
      )
    }
  } else if (approxMatch) {
    const target = toVnd(approxMatch[1], approxMatch[2])
    if (target) {
      const delta = Math.round(target * 0.18)
      parsed.priceMin = Math.max(0, target - delta)
      parsed.priceMax = target + delta
      parsed.recognizedTags.push({
        key: 'price',
        label: `Giá: ~${formatShortPrice(target)}`,
      })
      working = working.replace(
        /(?:tầm|tam|khoảng|khoang|giá|gia|tài chính|tai chinh|ngân sách|ngan sach)\s*\d+(?:[.,]\d+)?\s*(?:tỷ|ty|tỉ|ti|triệu|trieu|tr|củ|cu)(?:\s*\d{1,3})?/gi,
        ' '
      )
    }
  }

  norm = normalizeSearchText(working)

  // 2. Nhận diện Dòng xe (Model) & tự suy ra Hãng xe (Make)
  for (const m of KNOWN_MODELS) {
    const matchedAlias = m.aliases.find((alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]+/g, '[-\\s]?')
      return new RegExp(`\\b${escaped}\\b`, 'i').test(norm)
    })
    if (matchedAlias) {
      parsed.model = m.model
      parsed.make = m.make
      parsed.recognizedTags.push({
        key: 'make',
        label: `Hãng: ${m.brandLabel}`,
        value: m.make,
      })
      parsed.recognizedTags.push({
        key: 'model',
        label: `Dòng xe: ${m.model}`,
        value: m.model,
      })
      const removeRx = new RegExp(
        `\\b${matchedAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]+/g, '[-\\s]?')}\\b`,
        'gi'
      )
      working = working.replace(removeRx, ' ')
      norm = normalizeSearchText(working)
      break
    }
  }

  // 3. Nhận diện Hãng xe (Make) nếu chưa có hoặc nếu người dùng gõ kèm tên hãng
  for (const b of KNOWN_BRANDS) {
    const matchedBrandAlias = b.aliases.find((alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]+/g, '[-\\s]?')
      return new RegExp(`\\b${escaped}\\b`, 'i').test(norm)
    })
    if (matchedBrandAlias) {
      if (!parsed.make) {
        parsed.make = b.make
        parsed.recognizedTags.push({
          key: 'make',
          label: `Hãng: ${b.label}`,
          value: b.make,
        })
      }
      const removeRx = new RegExp(
        `\\b${matchedBrandAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]+/g, '[-\\s]?')}\\b`,
        'gi'
      )
      working = working.replace(removeRx, ' ')
      norm = normalizeSearchText(working)
      break
    }
  }

  // 4. Nhận diện Kiểu dáng (BodyType)
  if (/\b(suv|gam cao|crossover|cuv|7 cho)\b/.test(norm)) {
    parsed.bodyType = 'SUV'
    parsed.recognizedTags.push({
      key: 'bodyType',
      label: `Kiểu dáng: ${BODY_TYPE_LABEL.SUV}`,
      value: 'SUV',
    })
    working = working.replace(/gầm\s*cao|gam\s*cao|\bsuv\b|\bcrossover\b|\bcuv\b|7\s*chỗ|7\s*cho/gi, ' ')
  } else if (/\b(sedan|gam thap|4 cho)\b/.test(norm)) {
    parsed.bodyType = 'SEDAN'
    parsed.recognizedTags.push({
      key: 'bodyType',
      label: `Kiểu dáng: ${BODY_TYPE_LABEL.SEDAN}`,
      value: 'SEDAN',
    })
    working = working.replace(/\bsedan\b|gầm\s*thấp|gam\s*thap|4\s*chỗ|4\s*cho/gi, ' ')
  } else if (/\b(hatchback|hatback|hb)\b/.test(norm)) {
    parsed.bodyType = 'HATCHBACK'
    parsed.recognizedTags.push({
      key: 'bodyType',
      label: `Kiểu dáng: ${BODY_TYPE_LABEL.HATCHBACK}`,
      value: 'HATCHBACK',
    })
    working = working.replace(/\bhatchback\b|\bhatback\b|\bhb\b/gi, ' ')
  } else if (/\b(ban tai|pickup|pick-up)\b/.test(norm)) {
    parsed.bodyType = 'PICKUP'
    parsed.recognizedTags.push({
      key: 'bodyType',
      label: `Kiểu dáng: ${BODY_TYPE_LABEL.PICKUP}`,
      value: 'PICKUP',
    })
    working = working.replace(/bán\s*tải|ban\s*tai|\bpickup\b|\bpick-up\b/gi, ' ')
  } else if (/\b(mpv|da dung)\b/.test(norm)) {
    parsed.bodyType = 'MPV'
    parsed.recognizedTags.push({
      key: 'bodyType',
      label: `Kiểu dáng: ${BODY_TYPE_LABEL.MPV}`,
      value: 'MPV',
    })
    working = working.replace(/\bmpv\b|đa\s*dụng|da\s*dung/gi, ' ')
  }

  norm = normalizeSearchText(working)

  // 5. Nhận diện Nhiên liệu (FuelType)
  if (/\b(may dau|xe dau|diesel|chay dau)\b/.test(norm)) {
    parsed.fuelType = 'DIESEL'
    parsed.recognizedTags.push({
      key: 'fuelType',
      label: `Nhiên liệu: ${FUEL_TYPE_LABEL.DIESEL}`,
      value: 'DIESEL',
    })
    working = working.replace(/máy\s*dầu|may\s*dau|xe\s*dầu|xe\s*dau|chạy\s*dầu|chay\s*dau|\bdiesel\b/gi, ' ')
  } else if (/\b(may xang|xe xang|chay xang)\b/.test(norm)) {
    parsed.fuelType = 'GASOLINE'
    parsed.recognizedTags.push({
      key: 'fuelType',
      label: `Nhiên liệu: ${FUEL_TYPE_LABEL.GASOLINE}`,
      value: 'GASOLINE',
    })
    working = working.replace(/máy\s*xăng|may\s*xang|xe\s*xăng|xe\s*xang|chạy\s*xăng|chay\s*xang/gi, ' ')
  } else if (/\b(hybrid|xang lai dien|lai dien)\b/.test(norm)) {
    parsed.fuelType = 'HYBRID'
    parsed.recognizedTags.push({
      key: 'fuelType',
      label: `Nhiên liệu: ${FUEL_TYPE_LABEL.HYBRID}`,
      value: 'HYBRID',
    })
    working = working.replace(/\bhybrid\b|xăng\s*lai\s*điện|xang\s*lai\s*dien|lai\s*điện|lai\s*dien/gi, ' ')
  } else if (/\b(xe dien|thuan dien|chay dien)\b/.test(norm)) {
    parsed.fuelType = 'ELECTRIC'
    parsed.recognizedTags.push({
      key: 'fuelType',
      label: `Nhiên liệu: ${FUEL_TYPE_LABEL.ELECTRIC}`,
      value: 'ELECTRIC',
    })
    working = working.replace(/xe\s*điện|xe\s*dien|thuần\s*điện|thuan\s*dien|chạy\s*điện|chay\s*dien/gi, ' ')
  }

  norm = normalizeSearchText(working)

  // 6. Nhận diện Hộp số (Transmission)
  if (/\b(so tu dong|tu dong|\bat\b)\b/.test(norm)) {
    parsed.transmission = 'AUTOMATIC'
    parsed.recognizedTags.push({
      key: 'transmission',
      label: `Hộp số: ${TRANSMISSION_LABEL.AUTOMATIC}`,
      value: 'AUTOMATIC',
    })
    working = working.replace(/số\s*tự\s*động|so\s*tu\s*dong|tự\s*động|tu\s*dong|\bat\b/gi, ' ')
  } else if (/\b(so san|\bmt\b)\b/.test(norm)) {
    parsed.transmission = 'MANUAL'
    parsed.recognizedTags.push({
      key: 'transmission',
      label: `Hộp số: ${TRANSMISSION_LABEL.MANUAL}`,
      value: 'MANUAL',
    })
    working = working.replace(/số\s*sàn|so\s*san|\bmt\b/gi, ' ')
  } else if (/\b(cvt|vo cap)\b/.test(norm)) {
    parsed.transmission = 'CVT'
    parsed.recognizedTags.push({
      key: 'transmission',
      label: `Hộp số: ${TRANSMISSION_LABEL.CVT}`,
      value: 'CVT',
    })
    working = working.replace(/\bcvt\b|vô\s*cấp|vo\s*cap/gi, ' ')
  }

  norm = normalizeSearchText(working)

  // 7. Nhận diện Năm sản xuất (Year)
  const yearMatch = norm.match(/\b(201\d|202\d)\b/)
  if (yearMatch) {
    const y = Number(yearMatch[1])
    parsed.yearMin = y
    parsed.yearMax = y
    parsed.recognizedTags.push({
      key: 'year',
      label: `Năm SX: ${y}`,
      value: String(y),
    })
    working = working.replace(new RegExp(`(?:đời|doi|năm|nam|sx)?\\s*\\b${y}\\b`, 'gi'), ' ')
  }

  // 8. Làm sạch phần từ khóa còn lại
  const leftoverTokens = working
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false
      const n = normalizeSearchText(t)
      return !['xe', 'oto', 'tim', 'mua', 'can', 'doi', 'nam', 'cho', 'mau', 'dong', 'chiec'].includes(n)
    })

  // Nếu đã nhận diện được model chuẩn (vd CX-5) và có phần dư (vd Premium), gộp thành từ khóa search chuẩn
  const searchParts = []
  if (parsed.model) searchParts.push(parsed.model)
  if (leftoverTokens.length > 0) searchParts.push(leftoverTokens.join(' '))
  parsed.cleanSearch = searchParts.join(' ').trim()

  parsed.hasStructuredFilters = parsed.recognizedTags.length > 0

  return parsed
}

/**
 * Chuyển kết quả phân tích thông minh thành bộ tham số URL cho trang /xe
 */
export function buildSearchParamsFromSmartQuery(rawQuery = '', explicitOverrides = {}) {
  const parsed = parseSmartSearchQuery(rawQuery)
  const params = {}

  if (parsed.make) params.make = parsed.make
  if (parsed.bodyType) params.bodyType = parsed.bodyType
  if (parsed.fuelType) params.fuelType = parsed.fuelType
  if (parsed.transmission) params.transmission = parsed.transmission
  if (parsed.yearMin) params.yearMin = String(parsed.yearMin)
  if (parsed.yearMax) params.yearMax = String(parsed.yearMax)
  if (parsed.priceMin !== undefined) params.priceMin = String(parsed.priceMin)
  if (parsed.priceMax !== undefined) params.priceMax = String(parsed.priceMax)

  // Nếu người dùng nhập từ khóa chưa map hết vào filter (hoặc có model cụ thể), gửi vào `search`
  if (parsed.cleanSearch) {
    params.search = parsed.cleanSearch
  } else if (!parsed.hasStructuredFilters && rawQuery.trim()) {
    params.search = rawQuery.trim()
  }

  // Ghi đè bởi dropdown Thương hiệu / Khoảng giá nếu người dùng chọn thủ công
  Object.entries(explicitOverrides).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params[key] = String(val)
    }
  })

  return { params, parsed }
}

/**
 * Gợi ý từ khóa thông minh theo thời gian thực khi người dùng gõ vào ô tìm kiếm.
 */
export function getKeywordSuggestions(rawInput = '', dynamicBrands = []) {
  const trimmed = String(rawInput || '').trim()
  if (!trimmed) return QUICK_SEARCH_PRESETS.slice(0, 6)

  const normQuery = normalizeSearchText(trimmed)
  const compactQuery = normalizeCompactToken(trimmed)

  const candidatePool = []

  // 1. Dòng xe phổ biến (Models)
  for (const m of KNOWN_MODELS) {
    const fullTitle = `${m.brandLabel} ${m.model}`
    candidatePool.push({
      id: `model-${m.make}-${m.model}`,
      label: fullTitle,
      subLabel: `Dòng xe ${BODY_TYPE_LABEL[m.bodyType] || m.bodyType} · ${m.brandLabel}`,
      category: 'model',
      keywords: [fullTitle, m.model, m.brandLabel, ...m.aliases],
      params: { make: m.make, search: m.model },
    })
  }

  // 2. Hãng xe (Brands từ DB + danh mục chuẩn)
  const seenMakes = new Set()
  const brandSource = [
    ...dynamicBrands.map((b) => ({ make: b.value, label: b.label, aliases: [b.label] })),
    ...KNOWN_BRANDS,
  ]
  for (const b of brandSource) {
    if (!b.make || seenMakes.has(b.make)) continue
    seenMakes.add(b.make)
    candidatePool.push({
      id: `brand-${b.make}`,
      label: `Xe ${b.label}`,
      subLabel: `Tất cả xe hãng ${b.label}`,
      category: 'brand',
      keywords: [b.label, `xe ${b.label}`, ...(b.aliases || [])],
      params: { make: b.make },
    })
  }

  // 3. Kiểu dáng & Tổ hợp thông dụng
  candidatePool.push(
    {
      id: 'body-suv',
      label: 'Xe SUV / Gầm cao 5-7 chỗ',
      subLabel: 'Kiểu dáng SUV đa dụng',
      category: 'body',
      keywords: ['suv', 'gam cao', '7 cho', '5 cho gam cao', 'crossover', 'cuv', 'xe gia dinh'],
      params: { bodyType: 'SUV' },
    },
    {
      id: 'body-sedan',
      label: 'Xe Sedan 4-5 chỗ đi phố',
      subLabel: 'Kiểu dáng Sedan lịch lãm',
      category: 'body',
      keywords: ['sedan', 'gam thap', '4 cho', 'xe di pho'],
      params: { bodyType: 'SEDAN' },
    },
    {
      id: 'body-pickup',
      label: 'Xe Bán tải (Pickup)',
      subLabel: 'Kiểu dáng Bán tải mạnh mẽ',
      category: 'body',
      keywords: ['ban tai', 'pickup', 'pick-up', 'xe ban tai'],
      params: { bodyType: 'PICKUP' },
    },
    {
      id: 'body-mpv',
      label: 'Xe MPV 7 chỗ gia đình',
      subLabel: 'Kiểu dáng MPV rộng rãi',
      category: 'body',
      keywords: ['mpv', 'da dung', '7 cho gia dinh'],
      params: { bodyType: 'MPV' },
    },
    {
      id: 'body-hatchback',
      label: 'Xe Hatchback nhỏ gọn đô thị',
      subLabel: 'Kiểu dáng Hatchback',
      category: 'body',
      keywords: ['hatchback', 'hb', 'xe nho gon', 'xe do thi'],
      params: { bodyType: 'HATCHBACK' },
    },
    {
      id: 'spec-diesel',
      label: 'Xe máy dầu tiết kiệm nhiên liệu',
      subLabel: 'Nhiên liệu Dầu Diesel',
      category: 'spec',
      keywords: ['may dau', 'xe dau', 'diesel', 'tiet kiem'],
      params: { fuelType: 'DIESEL' },
    },
    {
      id: 'spec-hybrid',
      label: 'Xe Hybrid xăng lai điện',
      subLabel: 'Nhiên liệu Hybrid',
      category: 'spec',
      keywords: ['hybrid', 'xang lai dien', 'tiet kiem xang'],
      params: { fuelType: 'HYBRID' },
    },
    {
      id: 'spec-electric',
      label: 'Xe ô tô điện thông minh',
      subLabel: 'Nhiên liệu Điện (EV)',
      category: 'spec',
      keywords: ['xe dien', 'thuan dien', 'ev', 'vinfast vf'],
      params: { fuelType: 'ELECTRIC' },
    },
    {
      id: 'spec-auto',
      label: 'Xe số tự động dễ lái',
      subLabel: 'Hộp số Tự động (AT)',
      category: 'spec',
      keywords: ['so tu dong', 'tu dong', 'at'],
      params: { transmission: 'AUTOMATIC' },
    }
  )

  const scored = []
  for (const item of candidatePool) {
    let bestScore = 0
    for (const kw of item.keywords) {
      const normKw = normalizeSearchText(kw)
      const compactKw = normalizeCompactToken(kw)

      if (compactKw === compactQuery || normKw === normQuery) {
        bestScore = Math.max(bestScore, 100)
      } else if (compactKw.startsWith(compactQuery) || normKw.startsWith(normQuery)) {
        bestScore = Math.max(bestScore, 85)
      } else if (
        normKw.split(' ').some((w) => w.startsWith(normQuery)) ||
        compactKw.includes(compactQuery)
      ) {
        bestScore = Math.max(bestScore, 70)
      } else if (normQuery.includes(normKw) && normKw.length >= 2) {
        bestScore = Math.max(bestScore, 60)
      }
    }

    if (bestScore > 0) {
      scored.push({ ...item, score: bestScore })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 6)
}

export function getRecentSearches() {
  try {
    const raw = globalThis.localStorage?.getItem(RECENT_SEARCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && x.trim()).slice(0, 6) : []
  } catch {
    return []
  }
}

export function saveRecentSearch(query = '') {
  const clean = String(query || '').trim()
  if (!clean || clean.length < 2) return
  try {
    const current = getRecentSearches().filter(
      (item) => normalizeSearchText(item) !== normalizeSearchText(clean)
    )
    const next = [clean, ...current].slice(0, 6)
    globalThis.localStorage?.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage errors
  }
}

export function clearRecentSearches() {
  try {
    globalThis.localStorage?.removeItem(RECENT_SEARCHES_KEY)
  } catch {
    // Ignore storage errors
  }
}
