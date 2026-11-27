import { PRICE_MAX, PRICE_MIN } from '../constants/installmentConstants'

// Xe đang bán → lựa chọn của ô "Chọn xe" ở trang Tính trả góp.
// Ref: .sdd/features/installment-calculator/SPEC.md#REQ-F17

const hasPrice = (car) => typeof car?.price === 'number' && car.price >= PRICE_MIN && car.price <= PRICE_MAX

/**
 * Tên xe ngắn: "Toyota Vios G 2021". Dữ liệu có xe ghi sẵn hãng/năm trong `model` ("Hyundai SantaFe … 2.5L")
 * → bỏ phần đã có để không lặp "HYUNDAI Hyundai".
 */
export const carName = (car) => {
  const model = String(car.model ?? '')
  const lower = model.toLowerCase()
  const make = car.make && !lower.includes(String(car.make).toLowerCase()) ? car.make : null
  const year = car.year && !lower.includes(String(car.year)) ? car.year : null
  return [make, model, car.variant, year].filter(Boolean).join(' ')
}

/**
 * Chỉ giữ xe có giá hợp lệ, mỗi xe một lần (theo vehicleCode/_id), sắp theo tên.
 * @returns {Array<{ id: string, code: string|null, name: string, price: number, image: string|null }>}
 */
export function toCarOptions(cars) {
  const seen = new Set()
  return (cars ?? [])
    .filter(hasPrice)
    .map((car) => ({
      id: String(car.vehicleCode ?? car._id),
      code: car.vehicleCode ?? null,
      name: carName(car),
      price: Math.round(car.price),
      image: car.images?.[0]?.url ?? null,
    }))
    .filter((item) => (seen.has(item.id) ? false : seen.add(item.id)))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

/**
 * Xe được chọn sẵn khi mở trang: `?car=` nếu có trong danh sách; không có `?car=` mà có `?price=` (liên kết cũ)
 * → không chọn xe, giữ giá theo liên kết; còn lại → xe đầu danh sách.
 */
export function initialCarId(options, { carParam = null, hasPriceParam = false } = {}) {
  if (carParam && options.some((item) => item.id === carParam)) return carParam
  if (hasPriceParam) return null
  return options[0]?.id ?? null
}
