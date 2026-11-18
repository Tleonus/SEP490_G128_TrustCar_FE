// Xe mà khách đang giữ ở một lượt chưa diễn ra. BE không cho một khách giữ cùng một xe ở hai lượt mở
// ("Bạn đã có lịch cho xe …"), nên FE báo trước ngay khi mở hộp đặt lịch thay vì đợi bấm đặt mới biết.

const OPEN = ['PENDING', 'CONFIRMED']

const carIdOf = (appointment) => {
  const car = appointment?.car
  const id = typeof car === 'string' ? car : car?._id ?? car?.id
  return id ? String(id) : null
}

/**
 * Tập id các xe đang được giữ ở lượt còn mở (Chờ xác nhận / Đã xác nhận) và chưa tới giờ hẹn.
 * Lịch con đã hủy (xe ngừng bán) không tính. Chỉ là gợi ý: BE vẫn quyết định cuối cùng.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F05
 * @param {object[]} visits  Các lượt của khách (`fetchMyVisits`)
 * @param {number} [nowMs]
 * @returns {Set<string>}
 */
export function heldCarIds(visits, nowMs = Date.now()) {
  const held = new Set()
  ;(visits ?? []).forEach((visit) => {
    if (!OPEN.includes(visit?.status)) return
    if (!(new Date(visit.scheduledAt).getTime() > nowMs)) return
    ;(visit.appointments ?? []).forEach((appointment) => {
      const id = OPEN.includes(appointment?.status) ? carIdOf(appointment) : null
      if (id) held.add(id)
    })
  })
  return held
}

/** Các xe đã chọn mà khách đang giữ ở lượt khác. */
export const heldAmong = (selected, held) => (selected ?? []).filter((car) => held.has(String(car.id)))

/** "Bạn đã có lịch cho xe A, B." (câu giống thông báo BE trả khi gửi). */
export const heldMessage = (cars) => `Bạn đã có lịch cho xe ${cars.map((car) => car.title).join(', ')}.`
