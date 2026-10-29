export function getCarTitle(car) {
  if (!car) return ''
  return [car.make, car.model, car.variant].filter(Boolean).join(' ')
}

export function sortCarImages(images = []) {
  return [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
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
