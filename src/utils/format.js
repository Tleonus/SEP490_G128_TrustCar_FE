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

export const TRANSMISSION_LABEL = {
  automatic: 'Số tự động',
  manual: 'Số sàn',
}

export const FUEL_LABEL = {
  gasoline: 'Xăng',
  diesel: 'Dầu diesel',
  electric: 'Điện',
  hybrid: 'Hybrid',
}

export const BODY_TYPE_LABEL = {
  sedan: 'Sedan',
  suv: 'SUV / Gầm cao',
  hatchback: 'Hatchback',
  pickup: 'Bán tải',
  mpv: 'MPV',
}
