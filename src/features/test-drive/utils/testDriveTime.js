// Mọi ngày giờ lái thử đều tính theo giờ Việt Nam, không phụ thuộc múi giờ của máy người dùng.
const SHOWROOM_TIME_ZONE = 'Asia/Ho_Chi_Minh'
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const localDateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: SHOWROOM_TIME_ZONE })
const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: SHOWROOM_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const weekdayFormat = new Intl.DateTimeFormat('vi-VN', { timeZone: SHOWROOM_TIME_ZONE, weekday: 'long' })

/** Ngày YYYY-MM-DD theo giờ Việt Nam. */
export function getLocalDate(instant = new Date()) {
  return localDateFormat.format(new Date(instant))
}

export function isLocalDate(value) {
  if (!LOCAL_DATE_PATTERN.test(value ?? '')) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function addLocalDays(date, days) {
  const shifted = new Date(`${date}T00:00:00.000Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

export function formatTime(instant) {
  return timeFormat.format(new Date(instant))
}

export function getEndInstant({ scheduledAt, durationMinutes }) {
  return new Date(new Date(scheduledAt).getTime() + (durationMinutes ?? 60) * 60000)
}

export function formatTimeRange(appointment) {
  return `${formatTime(appointment.scheduledAt)} – ${formatTime(getEndInstant(appointment))}`
}

/** 2026-11-09 → "Thứ Hai, 09/11/2026". */
export function formatDayLabel(date) {
  const noon = new Date(`${date}T12:00:00+07:00`)
  const weekday = weekdayFormat.format(noon)
  const [year, month, day] = date.split('-')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day}/${month}/${year}`
}

export function formatAppointmentWhen(appointment) {
  return `${formatDayLabel(getLocalDate(appointment.scheduledAt))} · ${formatTimeRange(appointment)}`
}
