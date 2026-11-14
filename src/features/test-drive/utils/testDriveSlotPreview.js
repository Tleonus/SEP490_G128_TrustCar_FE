// Xem trước khung giờ khi sửa cấu hình, cùng cách tính với generateSlots của BE.
// Không tính lịch riêng của từng ngày (ngày nghỉ, giờ đóng cửa sớm) vì đó là dữ liệu cấu hình showroom.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** @returns {string|null} Nội dung lỗi, hoặc null khi cấu hình hợp lệ. */
export function validateTestDriveSettings(settings) {
  const { openTime, closeTime, lunchBreakStart, lunchBreakEnd, slotDurationMinutes, maxGuestsPerSlot } = settings
  if (![openTime, closeTime, lunchBreakStart, lunchBreakEnd].every((time) => TIME_PATTERN.test(time ?? ''))) {
    return 'Hãy nhập đủ giờ lái thử và giờ nghỉ trưa.'
  }
  if (openTime >= closeTime) return 'Giờ kết thúc phải sau giờ bắt đầu.'
  if (lunchBreakStart >= lunchBreakEnd) return 'Giờ kết thúc nghỉ trưa phải sau giờ bắt đầu nghỉ trưa.'
  if (lunchBreakStart < openTime || lunchBreakEnd > closeTime) return 'Giờ nghỉ trưa phải nằm trong giờ lái thử.'
  if (!Number.isInteger(slotDurationMinutes) || slotDurationMinutes < 15 || slotDurationMinutes > 480) {
    return 'Độ dài khung phải từ 15 đến 480 phút.'
  }
  if (!Number.isInteger(maxGuestsPerSlot) || maxGuestsPerSlot < 1 || maxGuestsPerSlot > 100) {
    return 'Số khách mỗi khung phải từ 1 đến 100.'
  }
  return null
}

/** @returns {string[]} Các khung dạng "09:00 – 10:00". */
export function buildSlotPreview(settings) {
  if (validateTestDriveSettings(settings)) return []
  const duration = settings.slotDurationMinutes
  const lastEnd = toMinutes(settings.closeTime)
  const lunchStart = toMinutes(settings.lunchBreakStart)
  const lunchEnd = toMinutes(settings.lunchBreakEnd)

  const slots = []
  let start = toMinutes(settings.openTime)
  while (start + duration <= lastEnd) {
    if (start < lunchEnd && start + duration > lunchStart) {
      start = lunchEnd
    } else {
      slots.push(`${toTime(start)} – ${toTime(start + duration)}`)
      start += duration
    }
  }
  return slots
}
