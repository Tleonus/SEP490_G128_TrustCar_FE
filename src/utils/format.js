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

export function formatDate(value) {
  if (!value) return 'Đang cập nhật'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(value),
  )
}
