export function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatVnd(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

/** ms → { hours, minutes, seconds } */
export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

export const pad2 = (n) => String(n).padStart(2, '0')
