export function getCarTitle(car) {
  if (!car) return ''
  const brand = typeof car.brand === 'string' ? car.brand : car.brand?.brand_name
  const model = typeof car.model === 'string' ? car.model : car.model?.model_name
  return [car.make || brand, model, car.variant].filter(Boolean).join(' ')
}

export function sortCarImages(images = []) {
  return [...(images ?? [])].sort((a, b) => {
    const aCover = a?.isPrimary ?? a?.is_cover ?? false
    const bCover = b?.isPrimary ?? b?.is_cover ?? false
    if (aCover !== bCover) return aCover ? -1 : 1
    return (a?.display_order ?? 0) - (b?.display_order ?? 0)
  })
}

export function getCoverImage(car) {
  return sortCarImages(car?.images)[0]
}

// Tính lại daysInStock/agingCategory từ listedDate (field gốc, luôn đáng tin) thay vì tin thẳng
// Car.daysInStock/Car.agingCategory lưu trong DB.
// Lý do: backend có job updateInventoryAgingJob() (src/services/pricingService.js) để tính lại 2 field
// này mỗi ngày, nhưng job đó KHÔNG được wire vào cron/route nào (dead code) -> giá trị lưu trong DB chỉ
// là snapshot tại thời điểm seed, không cập nhật theo thời gian thực và có thể dùng ngưỡng khác (seeder
// dùng 30/90 ngày) với đúng công thức nghiệp vụ của pricingService.calculateAging (30/60 ngày - khớp với
// băng 0-30/31-60/60+ mà đề bài SCR-M03 mô tả). Hàm dưới đây copy lại chính xác công thức
// pricingService.calculateAging để FE luôn hiển thị số ngày tồn kho đúng tại thời điểm xem.
export function computeAging(listedDate) {
  if (!listedDate) return { daysInStock: 0, agingCategory: 'FRESH' }
  const diffMs = Date.now() - new Date(listedDate).getTime()
  const daysInStock = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  let agingCategory = 'FRESH'
  if (daysInStock > 60) agingCategory = 'STAGNANT'
  else if (daysInStock > 30) agingCategory = 'SLOW'
  return { daysInStock, agingCategory }
}

const MILLION = 1_000_000

// Bảng giá xe mới lăn bánh tham khảo tại Việt Nam (triệu VNĐ) cho các mẫu xe tại showroom
const REFERENCE_NEW_PRICES_MILLION = [
  { match: /everest.*titanium.*4x4/i, price: 1620 },
  { match: /everest.*titanium.*4x2/i, price: 1450 },
  { match: /everest.*sport/i, price: 1320 },
  { match: /everest/i, price: 1420 },
  { match: /territory.*titanium\s*x/i, price: 995 },
  { match: /territory.*titanium/i, price: 925 },
  { match: /territory/i, price: 910 },
  { match: /ranger.*wildtrak/i, price: 1045 },
  { match: /ranger.*xls/i, price: 765 },
  { match: /ranger/i, price: 820 },
  { match: /ecosport/i, price: 695 },
  { match: /santa\s*fe.*(diesel|dầu)/i, price: 1385 },
  { match: /santa\s*fe/i, price: 1310 },
  { match: /tucson.*turbo/i, price: 1055 },
  { match: /tucson/i, price: 980 },
  { match: /accent/i, price: 595 },
  { match: /\bi10\b/i, price: 485 },
  { match: /3008/i, price: 1220 },
  { match: /camry.*2\.5q/i, price: 1520 },
  { match: /camry/i, price: 1380 },
  { match: /hilux/i, price: 835 },
  { match: /mazda\s*3/i, price: 725 },
  { match: /cx-?5.*2\.5/i, price: 1090 },
  { match: /cx-?5/i, price: 960 },
  { match: /lux\s*sa2\.0/i, price: 1580 },
  { match: /lux\s*a2\.0/i, price: 1260 },
  { match: /vf\s*3/i, price: 335 },
  { match: /c300.*amg|c-class.*c300/i, price: 2150 },
  { match: /c250|c-class.*c250/i, price: 1920 },
  { match: /c-class/i, price: 1890 },
  { match: /sonet/i, price: 679 },
]

/**
 * Tính toán giá xe mới (lăn bánh tham khảo) và độ chênh lệch tiết kiệm khi mua xe cũ tại TrustCar.
 * Ưu tiên trường `newCarPrice` / `referenceNewCarPrice` / `marketPrice` từ backend nếu lớn hơn giá bán,
 * sau đó đối chiếu bảng giá xe mới tham khảo theo dòng xe hoặc ước tính theo năm SX & số km.
 */
export function getCarPriceComparison(car) {
  if (!car) return null
  const usedPrice = Number(car.price ?? car.listed_price ?? car.listedPrice)
  if (!Number.isFinite(usedPrice) || usedPrice <= 0) return null

  const explicitRef = Number(car.newCarPrice ?? car.referenceNewCarPrice ?? car.marketPrice)
  let newCarPrice

  if (Number.isFinite(explicitRef) && explicitRef > usedPrice) {
    newCarPrice = explicitRef
  } else {
    const fullName = [getCarTitle(car), car.fuelType].filter(Boolean).join(' ')
    const matched = REFERENCE_NEW_PRICES_MILLION.find((item) => item.match.test(fullName))
    if (matched && matched.price * MILLION >= usedPrice * 1.08) {
      newCarPrice = matched.price * MILLION
    } else {
      const currentYear = new Date().getFullYear()
      const carYear = Number(car.year ?? car.manufacturing_year) || currentYear
      const ageYears = Math.max(0, Math.min(12, currentYear - carYear))
      const mileageKm = Math.max(0, Number(car.mileage ?? car.mileage_km) || 0)
      const multiplier = Math.min(
        1.95,
        1.14 + ageYears * 0.055 + Math.min(0.12, (mileageKm / 20000) * 0.015),
      )
      newCarPrice = Math.round((usedPrice * multiplier) / (5 * MILLION)) * (5 * MILLION)
    }
  }

  if (!newCarPrice || newCarPrice <= usedPrice) return null

  const savingAmount = newCarPrice - usedPrice
  const savingPercent = Math.max(1, Math.round((savingAmount / newCarPrice) * 100))
  const usedPercent = Math.max(12, Math.min(95, 100 - savingPercent))

  return {
    usedPrice,
    newCarPrice,
    savingAmount,
    savingPercent,
    usedPercent,
  }
}
