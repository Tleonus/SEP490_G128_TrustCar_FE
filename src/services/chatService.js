import api from './api'
import { getCars, getFeaturedCars, sendContactRequest } from './carService'
import { getFilterOptions } from './brandService'
import { getBaseSettings, buildContactInfo } from '../config/contactInfo'
import { formatPrice, formatMileage } from '../utils/format'
import { getCarTitle, getCoverImage } from '../utils/car'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelOf } from '../utils/constants'

const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_API_URL || '/public/chat'

// Lưu trạng thái nếu BE chưa mount route /public/chat để không tốn vòng chờ 404 ở các câu tiếp theo
let backendChatRouteAvailable = null

function isRouteNotFound(error) {
  const status = error?.response?.status
  if (status === 501) return true
  if (status !== 404) return false
  const msg = String(error?.response?.data?.message || '')
  return /^Route\s.+\snot found/i.test(msg) || status === 404
}

const BRAND_PATTERNS = [
  { make: 'TOYOTA', regex: /\b(toyota|vios|camry|corolla|cross|fortuner|innova|raize|veloz|yaris)\b/i, label: 'Toyota' },
  { make: 'MAZDA', regex: /\b(mazda|cx-?5|cx-?8|cx-?3|cx-?30|mazda\s*3|mazda\s*6|mazda\s*2|bt-?50)\b/i, label: 'Mazda' },
  { make: 'HONDA', regex: /\b(honda|city|civic|cr-?v|hr-?v|br-?v|accord|brio)\b/i, label: 'Honda' },
  { make: 'HYUNDAI', regex: /\b(hyundai|accent|tucson|santafe|santa\s*fe|creta|elantra|i10|kona|stargazer|custin)\b/i, label: 'Hyundai' },
  { make: 'KIA', regex: /\b(kia|k3|k5|seltos|sonet|sorento|carnival|morning|cerato|soluto|sportage)\b/i, label: 'Kia' },
  { make: 'FORD', regex: /\b(ford|ranger|everest|territory|ecosport|explorer|transit|raptor)\b/i, label: 'Ford' },
  { make: 'VINFAST', regex: /\b(vinfast|vf\s*3|vf\s*5|vf\s*6|vf\s*7|vf\s*8|vf\s*9|vf\s*e34|lux\s*a|lux\s*sa|fadil)\b/i, label: 'VinFast' },
  { make: 'MERCEDES-BENZ', regex: /\b(mercedes|merc|c200|c300|e200|e300|glc|gle|gls|maybach|s450)\b/i, label: 'Mercedes-Benz' },
  { make: 'PEUGEOT', regex: /\b(peugeot|2008|3008|5008|408)\b/i, label: 'Peugeot' },
  { make: 'MITSUBISHI', regex: /\b(mitsubishi|xpander|outlander|attrage|pajero|triton|xforce)\b/i, label: 'Mitsubishi' },
  { make: 'BMW', regex: /\b(bmw|320i|330i|520i|x3|x5|x7)\b/i, label: 'BMW' },
  { make: 'LEXUS', regex: /\b(lexus|rx350|nx300|es250|lx570|lx600)\b/i, label: 'Lexus' },
]

const BODY_TYPE_PATTERNS = [
  { bodyType: 'SUV', regex: /\b(suv|gầm\s*cao|gam\s*cao|crossover|cuv|7\s*chỗ|7\s*cho|gia\s*đình)\b/i, label: 'SUV / Gầm cao' },
  { bodyType: 'SEDAN', regex: /\b(sedan|4\s*chỗ|5\s*chỗ\s*gầm\s*thấp|đi\s*phố)\b/i, label: 'Sedan' },
  { bodyType: 'HATCHBACK', regex: /\b(hatchback|nhỏ\s*gọn|xe\s*nhỏ)\b/i, label: 'Hatchback' },
  { bodyType: 'PICKUP', regex: /\b(bán\s*tải|ban\s*tai|pickup|pick-up)\b/i, label: 'Bán tải (Pickup)' },
  { bodyType: 'MPV', regex: /\b(mpv|đa\s*dụng)\b/i, label: 'MPV đa dụng' },
]

/**
 * Trích xuất khoảng giá (VNĐ) từ câu hỏi tiếng Việt.
 * Ví dụ: "dưới 500 triệu", "từ 500 đến 800 triệu", "tầm 600tr", "trên 1 tỷ"
 */
export function parsePriceIntent(text) {
  const normalized = text.toLowerCase().replace(/,/g, '.')

  // Khoảng từ X đến Y triệu / tỷ
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(triệu|tr|tỷ|ty)?\s*(?:đến|tới|-|->|~)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|tỷ|ty)/i)
  if (rangeMatch) {
    const rawMin = parseFloat(rangeMatch[1])
    const unitMin = rangeMatch[2] || rangeMatch[4]
    const rawMax = parseFloat(rangeMatch[3])
    const unitMax = rangeMatch[4]
    const multMin = /tỷ|ty/i.test(unitMin) ? 1_000_000_000 : 1_000_000
    const multMax = /tỷ|ty/i.test(unitMax) ? 1_000_000_000 : 1_000_000
    return {
      priceMin: Math.round(rawMin * multMin),
      priceMax: Math.round(rawMax * multMax),
      label: `từ ${rawMin} ${/tỷ|ty/i.test(unitMin) ? 'tỷ' : 'triệu'} đến ${rawMax} ${/tỷ|ty/i.test(unitMax) ? 'tỷ' : 'triệu'}`,
    }
  }

  // Dưới X triệu / tỷ
  const underMatch = normalized.match(/(?:dưới|duoi|nhỏ hơn|ít hơn|tối đa|<|<=)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|tỷ|ty)/i)
  if (underMatch) {
    const val = parseFloat(underMatch[1])
    const isBillion = /tỷ|ty/i.test(underMatch[2])
    const max = Math.round(val * (isBillion ? 1_000_000_000 : 1_000_000))
    return {
      priceMin: undefined,
      priceMax: max,
      label: `dưới ${val} ${isBillion ? 'tỷ' : 'triệu'}`,
    }
  }

  // Trên X triệu / tỷ
  const overMatch = normalized.match(/(?:trên|tren|hơn|từ|>|>=)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|tỷ|ty)/i)
  if (overMatch) {
    const val = parseFloat(overMatch[1])
    const isBillion = /tỷ|ty/i.test(overMatch[2])
    const min = Math.round(val * (isBillion ? 1_000_000_000 : 1_000_000))
    return {
      priceMin: min,
      priceMax: undefined,
      label: `trên ${val} ${isBillion ? 'tỷ' : 'triệu'}`,
    }
  }

  // "Tầm / khoảng X triệu / tỷ"
  const aroundMatch = normalized.match(/(?:tầm|tam|khoảng|khoang|ngân sách|tài chính|giá)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|tỷ|ty)/i)
  if (aroundMatch) {
    const val = parseFloat(aroundMatch[1])
    const isBillion = /tỷ|ty/i.test(aroundMatch[2])
    const center = val * (isBillion ? 1_000_000_000 : 1_000_000)
    const delta = isBillion ? 150_000_000 : 100_000_000
    return {
      priceMin: Math.max(0, Math.round(center - delta)),
      priceMax: Math.round(center + delta),
      label: `khoảng ${val} ${isBillion ? 'tỷ' : 'triệu'}`,
    }
  }

  return null
}

/**
 * Chuẩn hóa đối tượng Car từ API thành thẻ xe rút gọn hiển thị trong bong bóng chat.
 */
export function mapCarToChatCard(car) {
  const stockCode = car.vehicleCode || car.stock_code || car._id || car.id
  const cover = getCoverImage(car)
  const imageUrl = typeof cover === 'string' ? cover : cover?.image_url || cover?.url || null
  const bodyType = car.bodyType ?? car.model?.body_type
  const fuelType = car.fuelType ?? car.fuel_type

  return {
    id: car._id || stockCode,
    stockCode,
    title: getCarTitle(car),
    priceText: formatPrice(car.price ?? car.listed_price ?? car.listedPrice),
    year: car.year ?? car.manufacturing_year ?? '—',
    mileageText: formatMileage(car.mileage ?? car.mileage_km),
    bodyTypeLabel: bodyType ? labelOf(BODY_TYPE_LABEL, String(bodyType).toUpperCase()) : null,
    fuelLabel: fuelType ? labelOf(FUEL_TYPE_LABEL, String(fuelType).toUpperCase()) : null,
    transmissionLabel: car.transmission ? labelOf(TRANSMISSION_LABEL, String(car.transmission).toUpperCase()) : null,
    cpo: Boolean(car.cpoCertificateId),
    imageUrl,
    to: `/xe/${encodeURIComponent(stockCode)}`,
  }
}

function buildFilterUrl(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      qs.set(key, String(val))
    }
  })
  const query = qs.toString()
  return query ? `/xe?${query}` : '/xe'
}

/**
 * Gửi tin nhắn tới API thật của hệ thống:
 * 1. Nếu BE có endpoint POST /public/chat (hoặc VITE_CHAT_API_URL), gọi trực tiếp.
 * 2. Kết hợp truy vấn dữ liệu thật từ GET /public/cars, /public/cars/featured, /public/cars/filters
 *    và POST /leads để trả lời chính xác theo kho xe thực tế trên DB.
 */
export async function sendChatMessage({ message, history = [], sessionId, signal }) {
  const text = String(message || '').trim()
  const contactInfo = buildContactInfo(getBaseSettings())

  // 1. Thử gọi endpoint AI Chat chuyên biệt trên Backend nếu khả dụng
  if (backendChatRouteAvailable !== false) {
    try {
      const { data } = await api.post(
        CHAT_ENDPOINT,
        {
          message: text,
          sessionId,
          history: history.slice(-8).map((m) => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        },
        { signal, timeout: 8000 }
      )
      backendChatRouteAvailable = true
      const payload = data?.data ?? data
      if (payload && (payload.reply || payload.message || payload.text)) {
        const rawCars = Array.isArray(payload.cars) ? payload.cars : []
        return {
          text: payload.reply || payload.message || payload.text,
          cars: rawCars.slice(0, 3).map(mapCarToChatCard),
          actions: payload.actions || [
            { label: 'Xem danh sách xe', to: '/xe', type: 'navigate' },
            { label: 'Đặt lịch xem xe', to: '/lien-he', type: 'navigate' },
          ],
          followUps: payload.suggestions || payload.followUps || [
            'Xe gầm cao cho gia đình',
            'Xe dưới 600 triệu',
            'Thủ tục mua xe trả góp',
          ],
          source: 'backend-ai',
        }
      }
    } catch (err) {
      if (isRouteNotFound(err)) {
        backendChatRouteAvailable = false
      }
    }
  }

  // 2. Kiểm tra nếu người dùng để lại số điện thoại trong tin nhắn -> Gửi Lead thật lên POST /leads
  const phoneMatch = text.match(/(?:\+84|0)(?:3|5|7|8|9)\d{8}\b/)
  if (phoneMatch) {
    const phone = phoneMatch[0]
    try {
      await sendContactRequest({
        full_name: 'Khách hàng từ Trợ lý AI Chat',
        phone_number: phone,
        email: '',
        request_content: `Yêu cầu tư vấn qua Chatbot: "${text}"`,
      })
      return {
        text: `Cảm ơn bạn! TrustCar đã ghi nhận số điện thoại ${phone} vào hệ thống. Chuyên viên tư vấn sẽ liên hệ với bạn trong ít phút nữa, hoặc bạn có thể gọi trực tiếp Hotline ${contactInfo.phoneDisplay}.`,
        cars: [],
        actions: [
          { label: 'Khám phá kho xe hiện có', to: '/xe', type: 'navigate' },
          { label: `Gọi ngay ${contactInfo.phoneDisplay}`, href: contactInfo.phoneHref, type: 'external' },
        ],
        followUps: [
          'Xem các xe nổi bật nhất',
          'Địa chỉ Showroom ở đâu?',
          'Quy trình kiểm định 150+ hạng mục',
        ],
        source: 'leads-api',
      }
    } catch {
      // Nếu /leads chưa sẵn sàng, vẫn phản hồi mượt mà
      return {
        text: `TrustCar đã ghi nhận số điện thoại ${phone} của bạn! Để được ưu tiên kết nối ngay lập tức, bạn có thể nhấn gọi Hotline ${contactInfo.phoneDisplay} hoặc nhắn qua Zalo chính thức của Showroom nhé.`,
        cars: [],
        actions: [
          { label: `Gọi ${contactInfo.phoneDisplay}`, href: contactInfo.phoneHref, type: 'external' },
          { label: 'Chat Zalo Showroom', href: contactInfo.zaloUrl, type: 'external' },
          { label: 'Điền form đặt lịch hẹn', to: '/lien-he', type: 'navigate' },
        ],
        followUps: [
          'Xem xe mới về kho',
          'Tư vấn xe theo ngân sách',
        ],
        source: 'leads-fallback',
      }
    }
  }

  // 3. Phân tích ý định hỏi về Showroom / Địa chỉ / Giờ mở cửa / Liên hệ
  if (/\b(địa chỉ|dia chi|showroom|ở đâu|o dau|bản đồ|ban do|giờ mở cửa|연hệ|liên hệ|hotline|số điện thoại|cầu giấy|hoàng quán chi)\b/i.test(text)) {
    return {
      text: `📍 **${contactInfo.showroomName}**\n• Địa chỉ: ${contactInfo.showroomAddress}\n• Giờ mở cửa: ${contactInfo.showroomHours}\n• Hotline tư vấn: ${contactInfo.phoneDisplay}\n\nBạn có thể ghé trực tiếp Showroom để xem xe thực tế, kiểm tra chứng nhận CPO và đăng ký lái thử miễn phí!`,
      cars: [],
      actions: [
        { label: 'Trang Liên hệ & Bản đồ 3D', to: '/lien-he', type: 'navigate' },
        { label: 'Mở Google Maps chỉ đường', href: contactInfo.mapUrl, type: 'external' },
        { label: 'Chat qua Zalo', href: contactInfo.zaloUrl, type: 'external' },
      ],
      followUps: [
        'Đặt lịch xem xe & lái thử',
        'Xem các mẫu xe đang có sẵn',
        'Quy trình kiểm định 150+ hạng mục',
      ],
      source: 'showroom-info',
    }
  }

  // 4. Phân tích ý định hỏi về Đặt lịch xem xe / Lái thử
  if (/\b(đặt lịch|dat lich|lái thử|lai thu|hẹn xem xe|xem xe thực tế)\b/i.test(text)) {
    return {
      text: `📅 **Đặt lịch xem xe & Lái thử tại ${contactInfo.showroomName}**:\n• Khung giờ đón khách: ${contactInfo.showroomHours}\n• Địa điểm: ${contactInfo.showroomAddress}\n\nBạn có thể để lại **Số điện thoại** ngay tại khung chat này để chuyên viên xếp lịch, hoặc chuyển tới trang Liên hệ để chọn khung giờ mong muốn!`,
      cars: [],
      actions: [
        { label: 'Đi tới Form Đặt lịch xem xe', to: '/lien-he', type: 'navigate' },
        { label: `Gọi đặt lịch: ${contactInfo.phoneDisplay}`, href: contactInfo.phoneHref, type: 'external' },
        { label: 'Nhắn Zalo đặt lịch', href: contactInfo.zaloUrl, type: 'external' },
      ],
      followUps: [
        'Xem các mẫu xe đang có tại Showroom',
        'Thủ tục mua xe trả góp',
        'Chính sách bảo hành & kiểm định CPO',
      ],
      source: 'booking-info',
    }
  }

  // 5. Phân tích ý định hỏi về Thủ tục mua xe / Trả góp / Sang tên
  if (/\b(thủ tục|thu tuc|trả góp|tra gop|vay ngân hàng|sang tên|sang ten|hồ sơ|ho so|lãi suất|lai suat|pháp lý)\b/i.test(text)) {
    return {
      text: `📋 **Thủ tục mua xe & Hỗ trợ trả góp tại TrustCar**:\n1. **Hỗ trợ vay ngân hàng**: Lên tới 70% giá trị xe, thời hạn 5–7 năm, duyệt hồ sơ nhanh trong 24h.\n2. **Pháp lý minh bạch**: Hỗ trợ rút hồ sơ gốc, hợp đồng công chứng và sang tên trọn gói toàn quốc.\n3. **Cam kết văn bản**: Xe không đâm đụng ảnh hưởng kết cấu, không ngập nước, pháp lý chuẩn 100%.`,
      cars: [],
      actions: [
        { label: 'Nhận bảng tính trả góp chi tiết', to: '/lien-he', type: 'navigate' },
        { label: 'Xem danh sách xe hỗ trợ trả góp', to: '/xe', type: 'navigate' },
        { label: 'Tư vấn hồ sơ qua Zalo', href: contactInfo.zaloUrl, type: 'external' },
      ],
      followUps: [
        'Tư vấn xe dưới 600 triệu',
        'Xe gầm cao từ 600 đến 900 triệu',
        'Quy trình kiểm định 150+ hạng mục là gì?',
      ],
      source: 'procedure-info',
    }
  }

  // 6. Phân tích ý định hỏi về Kiểm định CPO / Bảo hành / Chất lượng
  if (/\b(kiểm định|kiem dinh|cpo|chứng nhận|chung nhan|bảo hành|bao hanh|150|chất lượng|đâm đụng|ngập nước)\b/i.test(text)) {
    return {
      text: `🛡️ **Tiêu chuẩn Kiểm định CPO 150+ Hạng mục tại TrustCar**:\n• **Động cơ & Hộp số**: Nguyên bản, vận hành êm ái, không đại tu.\n• **Khung gầm & Thân vỏ**: Không tai nạn ảnh hưởng kết cấu, keo chỉ nguyên zin.\n• **Hệ thống điện & Nội thất**: Không thủy kích/ngập nước, ODO chuẩn.\n• Mỗi xe đạt chuẩn đều được cấp **Chứng nhận CPO & Mã QR tra cứu công khai** ngay trên trang chi tiết xe!`,
      cars: [],
      actions: [
        { label: 'Xem các xe đạt chuẩn CPO', to: '/xe', type: 'navigate' },
        { label: 'Tìm hiểu thêm về TrustCar', to: '/ve-chung-toi', type: 'navigate' },
        { label: 'So sánh các mẫu xe', to: '/so-sanh', type: 'navigate' },
      ],
      followUps: [
        'Xem các mẫu xe nổi bật nhất',
        'Xe SUV gầm cao cho gia đình',
        'Đặt lịch xem xe tại Showroom',
      ],
      source: 'cpo-info',
    }
  }

  // 7. Truy vấn KHO XE THỰC TẾ qua API GET /public/cars & /public/cars/filters
  const priceIntent = parsePriceIntent(text)
  const brandMatch = BRAND_PATTERNS.find((b) => b.regex.test(text))
  const bodyMatch = BODY_TYPE_PATTERNS.find((b) => b.regex.test(text))

  // Nếu người dùng hỏi chung "Tư vấn xe theo ngân sách" mà chưa nêu số tiền cụ thể
  if (/ngân sách|tài chính|tầm giá|khoảng giá/i.test(text) && !priceIntent && !brandMatch && !bodyMatch) {
    try {
      const filters = await getFilterOptions()
      const { items } = await getFeaturedCars(3)
      const minP = filters?.priceRange?.min ? formatPrice(filters.priceRange.min) : '350 triệu'
      const maxP = filters?.priceRange?.max ? formatPrice(filters.priceRange.max) : 'trên 2 tỷ'
      return {
        text: `💰 Hiện kho xe thực tế của TrustCar đang có các mẫu xe đa dạng tầm giá từ **${minP}** đến **${maxP}**. Bạn đang dự kiến ngân sách khoảng bao nhiêu? Hãy chọn nhanh mức ngân sách bên dưới để mình lọc xe trực tiếp từ kho nhé!`,
        cars: items.slice(0, 3).map(mapCarToChatCard),
        actions: [
          { label: 'Xe dưới 500 triệu', to: '/xe?priceMax=500000000', type: 'navigate' },
          { label: 'Xe 500 - 800 triệu', to: '/xe?priceMin=500000000&priceMax=800000000', type: 'navigate' },
          { label: 'Xe trên 800 triệu', to: '/xe?priceMin=800000000', type: 'navigate' },
        ],
        followUps: [
          'Tìm xe dưới 500 triệu',
          'Tìm xe từ 500 đến 800 triệu',
          'Tìm xe từ 800 triệu đến 1.2 tỷ',
          'Tìm xe trên 1.2 tỷ',
        ],
        source: 'live-catalog-budget',
      }
    } catch {
      return {
        text: '💰 Bạn đang dự kiến ngân sách mua xe trong khoảng nào? Chọn nhanh một mức ngân sách bên dưới để mình lọc danh sách xe phù hợp nhất cho bạn nhé!',
        cars: [],
        actions: [
          { label: 'Xe dưới 500 triệu', to: '/xe?priceMax=500000000', type: 'navigate' },
          { label: 'Xe 500 - 800 triệu', to: '/xe?priceMin=500000000&priceMax=800000000', type: 'navigate' },
          { label: 'Tất cả xe trong kho', to: '/xe', type: 'navigate' },
        ],
        followUps: [
          'Tìm xe dưới 500 triệu',
          'Tìm xe từ 500 đến 800 triệu',
          'Tìm xe trên 800 triệu',
        ],
        source: 'budget-prompt',
      }
    }
  }

  // Xây dựng tham số truy vấn API /public/cars thật
  const queryParams = { limit: 4 }
  const filterCriteriaLabels = []

  if (brandMatch) {
    queryParams.make = brandMatch.make
    filterCriteriaLabels.push(`hãng **${brandMatch.label}**`)
  }
  if (bodyMatch) {
    queryParams.bodyType = bodyMatch.bodyType
    filterCriteriaLabels.push(`kiểu dáng **${bodyMatch.label}**`)
  }
  if (priceIntent) {
    if (priceIntent.priceMin) queryParams.priceMin = priceIntent.priceMin
    if (priceIntent.priceMax) queryParams.priceMax = priceIntent.priceMax
    filterCriteriaLabels.push(`tầm giá **${priceIntent.label}**`)
  }

  // Nếu câu hỏi có chứa tên mẫu xe cụ thể (vd: Camry, CX-5, Cr-v, Ranger, Tucson...)
  const modelKeywordMatch = text.match(/\b(camry|vios|corolla|cross|fortuner|innova|raize|veloz|cx-?5|cx-?8|cx-?30|mazda\s*3|mazda\s*6|city|civic|cr-?v|hr-?v|accent|tucson|santafe|santa\s*fe|creta|elantra|k3|k5|seltos|sonet|sorento|carnival|ranger|everest|territory|xpander|outlander|glc|c200|c300|e200|e300|vf\s*5|vf\s*6|vf\s*7|vf\s*8|vf\s*9|lux\s*a|lux\s*sa)\b/i)
  if (modelKeywordMatch && !queryParams.make) {
    queryParams.search = modelKeywordMatch[1]
  }

  try {
    const hasSpecificFilter = Boolean(brandMatch || bodyMatch || priceIntent || queryParams.search)
    let resultCars = []
    let totalCount = 0

    if (hasSpecificFilter) {
      const res = await getCars(queryParams)
      resultCars = res.items || []
      totalCount = res.total || resultCars.length
    } else {
      const featuredRes = await getFeaturedCars(4)
      resultCars = featuredRes.items || []
      totalCount = resultCars.length
      if (resultCars.length === 0) {
        const fallbackRes = await getCars({ limit: 4 })
        resultCars = fallbackRes.items || []
        totalCount = fallbackRes.total || resultCars.length
      }
    }

    const chatCards = resultCars.slice(0, 3).map(mapCarToChatCard)
    const targetListingUrl = buildFilterUrl({
      make: queryParams.make,
      bodyType: queryParams.bodyType,
      priceMin: queryParams.priceMin,
      priceMax: queryParams.priceMax,
      search: queryParams.search,
    })

    if (chatCards.length > 0) {
      const criteriaText = filterCriteriaLabels.length > 0
        ? `phù hợp với tiêu chí ${filterCriteriaLabels.join(', ')}`
        : 'nổi bật đang có sẵn tại Showroom TrustCar'

      return {
        text: `🚗 Mình tìm thấy **${totalCount} mẫu xe** trong kho thực tế ${criteriaText}. Dưới đây là các gợi ý tốt nhất dành cho bạn (nhấn trực tiếp vào thẻ xe để xem chi tiết & báo cáo kiểm định):`,
        cars: chatCards,
        actions: [
          {
            label: hasSpecificFilter ? `Xem tất cả ${totalCount} xe phù hợp` : 'Xem toàn bộ kho xe',
            to: targetListingUrl,
            type: 'navigate',
          },
          { label: 'Đặt lịch xem xe thực tế', to: '/lien-he', type: 'navigate' },
          { label: 'So sánh xe', to: '/so-sanh', type: 'navigate' },
        ],
        followUps: [
          'Thủ tục mua xe trả góp thế nào?',
          'Đặt lịch lái thử tại Showroom',
          'Tư vấn xe theo ngân sách khác',
          'Quy trình kiểm định 150+ hạng mục',
        ],
        source: 'live-cars-api',
      }
    }

    // Nếu bộ lọc hiện tại chưa có xe khớp 100%, lấy xe nổi bật để gợi ý thay thế
    const featuredFallback = await getFeaturedCars(3)
    const fallbackCards = (featuredFallback.items || []).slice(0, 3).map(mapCarToChatCard)

    return {
      text: `Hiện tại tiêu chí ${filterCriteriaLabels.join(', ') || `"${text}"`} chưa có mẫu xe khớp chính xác 100% trên kệ trực tuyến. Tuy nhiên Showroom vừa cập nhật thêm nhiều xe mới về đội! Bạn có thể tham khảo các mẫu xe nổi bật bên dưới hoặc để lại **Số điện thoại** để chuyên viên tìm xe đúng cấu hình cho bạn nhé.`,
      cars: fallbackCards,
      actions: [
        { label: 'Xem tất cả xe đang bán', to: '/xe', type: 'navigate' },
        { label: 'Gửi yêu cầu tìm xe theo ý muốn', to: '/lien-he', type: 'navigate' },
        { label: `Gọi Hotline ${contactInfo.phoneDisplay}`, href: contactInfo.phoneHref, type: 'external' },
      ],
      followUps: [
        'Xem xe SUV gầm cao',
        'Xem xe Sedan đi phố',
        'Tìm xe từ 500 đến 800 triệu',
      ],
      source: 'live-cars-empty-fallback',
    }
  } catch {
    return {
      text: `Mình đã ghi nhận câu hỏi: "${text}". Hiện kết nối dữ liệu kho xe đang bận trong giây lát, bạn có thể chuyển thẳng tới trang Danh sách xe hoặc liên hệ Hotline **${contactInfo.phoneDisplay}** / Zalo để được hỗ trợ tức thì nhé!`,
      cars: [],
      actions: [
        { label: 'Mở trang Danh sách xe', to: '/xe', type: 'navigate' },
        { label: 'Trang Liên hệ & Đặt lịch', to: '/lien-he', type: 'navigate' },
        { label: `Gọi ${contactInfo.phoneDisplay}`, href: contactInfo.phoneHref, type: 'external' },
      ],
      followUps: [
        'Địa chỉ Showroom ở đâu?',
        'Thủ tục mua xe trả góp',
        'Quy trình kiểm định CPO',
      ],
      source: 'network-fallback',
    }
  }
}

