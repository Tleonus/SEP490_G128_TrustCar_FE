export function formatPrice(value) {
  if (value == null) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatMileage(value) {
  if (value == null) return 'Đang cập nhật'
  return `${new Intl.NumberFormat('vi-VN').format(value)} km`
}
