import { PIPELINE_SUMMARY_STAGES } from '../constants/salesCrmConstants'

/** Chuỗi tìm kiếm không dấu, chữ thường ("Đặng" → "dang"). */
export function toSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
}

function matchesSearch(fields, keyword) {
  const needle = toSearchText(keyword)
  if (!needle) return true
  const compactNeedle = needle.replace(/[\s.-]/g, '')
  return fields.some((field) => {
    const text = toSearchText(field)
    return text.includes(needle) || (compactNeedle && text.replace(/[\s.-]/g, '').includes(compactNeedle))
  })
}

function searchFields(item) {
  return [
    item.code,
    item.customer?.fullName,
    item.customer?.phone,
    item.car?.vehicleCode,
    item.car?.title,
    item.car?.licensePlate,
  ]
}

/** @param {{ stage?: string|null, search?: string }} query */
export function filterLeads(leads, { stage, search } = {}) {
  return leads.filter((lead) => (!stage || lead.pipelineStage === stage) && matchesSearch(searchFields(lead), search))
}

export function filterAppointments(appointments, { type, search } = {}) {
  return appointments.filter((item) => (!type || item.type === type) && matchesSearch(searchFields(item), search))
}

/** Số lead theo 4 giai đoạn chính (luôn đủ khoá, mặc định 0). */
export function countByStage(leads) {
  const counts = Object.fromEntries(PIPELINE_SUMMARY_STAGES.map((stage) => [stage, 0]))
  for (const lead of leads) {
    if (lead.pipelineStage in counts) counts[lead.pipelineStage] += 1
  }
  return counts
}

export function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return { current, items: items.slice((current - 1) * pageSize, current * pageSize) }
}
