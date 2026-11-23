// Hộp tư vấn 5 câu ở điểm dừng 03. Chỉ chạy trong trình duyệt, không gửi đi đâu.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F08

export const NEEDS = [
  { value: 'commute', label: 'Đi làm hằng ngày', bodyTypes: ['SEDAN', 'HATCHBACK'] },
  { value: 'family', label: 'Gia đình, đi chơi xa', bodyTypes: ['SUV', 'MPV'] },
  { value: 'work', label: 'Công việc, chở hàng', bodyTypes: ['PICKUP', 'VAN'] },
  { value: 'any', label: 'Chưa rõ, cần gợi ý', bodyTypes: [] },
]

export const BUDGETS = [
  { value: 'u500', label: 'Dưới 500 triệu', min: 0, max: 500_000_000 },
  { value: '500-800', label: '500 – 800 triệu', min: 500_000_000, max: 800_000_000 },
  { value: '800-1200', label: '800 triệu – 1,2 tỷ', min: 800_000_000, max: 1_200_000_000 },
  { value: 'o1200', label: 'Trên 1,2 tỷ', min: 1_200_000_000, max: null },
]

export const PAYMENTS = [
  { value: 'cash', label: 'Trả thẳng' },
  { value: 'loan', label: 'Trả góp' },
]

export const SESSIONS = [
  { value: 'morning', label: 'Sáng' },
  { value: 'afternoon', label: 'Chiều' },
]
/** Khách chưa muốn lái thử: không cần chọn ngày. */
export const NO_VISIT = { value: 'none', label: 'Chưa muốn lái thử' }

export const STEPS = ['name', 'need', 'budget', 'payment', 'visit']
export const MAX_NAME = 60
const MAX_DAYS_AHEAD = 60

const find = (list, value) => list.find((x) => x.value === value)

/** Ngày dạng YYYY-MM-DD theo giờ máy người dùng. */
export function toDateInput(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function dateBounds(now = new Date()) {
  const max = new Date(now)
  max.setDate(max.getDate() + MAX_DAYS_AHEAD)
  return { min: toDateInput(now), max: toDateInput(max) }
}

/** Lỗi của bước hiện tại (chuỗi tiếng Việt) hoặc null nếu đi tiếp được. */
export function stepError(step, a, now = new Date()) {
  if (step === 'name') {
    const name = (a.name || '').trim()
    if (!name) return 'Vui lòng nhập tên.'
    return name.length > MAX_NAME ? `Tên tối đa ${MAX_NAME} ký tự.` : null
  }
  if (step === 'need') return find(NEEDS, a.need) ? null : 'Vui lòng chọn nhu cầu.'
  if (step === 'budget') return find(BUDGETS, a.budget) ? null : 'Vui lòng chọn ngân sách.'
  if (step === 'payment') return find(PAYMENTS, a.payment) ? null : 'Vui lòng chọn cách thanh toán.'
  if (a.session === NO_VISIT.value) return null
  const { min, max } = dateBounds(now)
  if (!a.date || a.date < min || a.date > max) return 'Chọn ngày từ hôm nay đến 60 ngày tới.'
  return find(SESSIONS, a.session) ? null : 'Vui lòng chọn buổi.'
}

export function summaryRows(a) {
  const [y, m, d] = (a.date || '').split('-')
  const visit = a.session === NO_VISIT.value ? 'Chưa' : a.date ? `${find(SESSIONS, a.session)?.label}, ${d}/${m}/${y}` : ''
  return [
    { label: 'Tên', value: (a.name || '').trim() },
    { label: 'Nhu cầu', value: find(NEEDS, a.need)?.label },
    { label: 'Ngân sách', value: find(BUDGETS, a.budget)?.label },
    { label: 'Thanh toán', value: find(PAYMENTS, a.payment)?.label },
    { label: 'Lái thử', value: visit },
  ]
}

function inBudget(car, budget) {
  const p = Number(car?.price)
  if (!budget || !Number.isFinite(p)) return false
  return p >= budget.min && (budget.max == null || p < budget.max)
}

/** Tối đa `limit` xe hợp ngân sách, ưu tiên đúng kiểu dáng với nhu cầu, rẻ trước. */
export function suggestCars(cars = [], a, limit = 3) {
  const budget = find(BUDGETS, a.budget)
  const types = find(NEEDS, a.need)?.bodyTypes ?? []
  const score = (c) => (types.includes(c.bodyType) ? 0 : 1)
  return cars
    .filter((c) => inBudget(c, budget))
    .sort((x, y) => score(x) - score(y) || x.price - y.price)
    .slice(0, limit)
}

/** Link danh sách xe đã lọc theo ngân sách (và kiểu dáng nếu nhu cầu chỉ ra một kiểu). */
export function carsLink(a) {
  const budget = find(BUDGETS, a.budget)
  const q = new URLSearchParams()
  if (budget?.min) q.set('priceMin', String(budget.min))
  if (budget?.max) q.set('priceMax', String(budget.max))
  const s = q.toString()
  return s ? `/xe?${s}` : '/xe'
}
