/**
 * KAN-55 – Nội dung banner "biên bản bị trả lại".
 *
 * YÊU CẦU CỦA TICKET là lấy nội dung từ `rejectedReason`, NHƯNG Backend hiện tại
 * KHÔNG có trường này ở bất kỳ đâu:
 *   - `Car` chỉ có status/REJECTED, statusChangedBy/At, priceHistory[].reason (của giá);
 *   - `InspectionRecord` có result ('PASSED'|'FAILED'), criteria (5 boolean), notes,
 *     groups[].note, groups[].items[].note — không có rejectedReason;
 *   - lý do của lần đổi trạng thái thủ công chỉ nằm trong ActivityLog.metadata.reason
 *     và BE không có API đọc ActivityLog cho màn này.
 * Nên hàm này đọc `rejectedReason` nếu Backend bổ sung sau này (tương thích sẵn),
 * còn hiện tại dựng nội dung từ dữ liệu thật của biên bản đã gửi: tiêu chí không đạt
 * và ghi chú kỹ thuật của từng nhóm/hạng mục. Không hardcode nội dung giả.
 */

import { CRITERIA_LABEL } from '../constants/inspectionConstants'

/** Các tên trường có thể chứa lý do trả biên bản, thử theo thứ tự. */
const REASON_FIELDS = ['rejectedReason', 'rejectionReason', 'rejectReason', 'statusReason', 'statusNote']

function firstReasonField(...sources) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const field of REASON_FIELDS) {
      const value = source[field]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }
  return null
}

/** 5 tiêu chí mà Backend chấm không đạt (criteria: { noMajorAccident: false, … }). */
export function failedCriteriaOf(record) {
  const criteria = record?.criteria
  if (!criteria || typeof criteria !== 'object') return []
  return Object.entries(criteria)
    .filter(([, passed]) => passed === false)
    .map(([key]) => CRITERIA_LABEL[key] || key)
}

/** Ghi chú kỹ thuật đã lưu trong biên bản (note của nhóm và của hạng mục FAIL). */
export function inspectionNotesOf(record) {
  const notes = []
  ;(record?.groups || []).forEach((group) => {
    const label = CRITERIA_LABEL[group?.criteriaKey] || group?.groupKey
    if (typeof group?.note === 'string' && group.note.trim()) {
      notes.push({ scope: label, text: group.note.trim() })
    }
    ;(group?.items || []).forEach((item) => {
      if (item?.result === 'FAIL' && typeof item.note === 'string' && item.note.trim()) {
        notes.push({ scope: label, text: item.note.trim() })
      }
    })
  })
  if (typeof record?.notes === 'string' && record.notes.trim()) {
    notes.push({ scope: 'Tổng hợp', text: record.notes.trim() })
  }
  return notes
}

/**
 * @param {object} params
 * @param {object} [params.car]        xe (để tìm rejectedReason nếu BE bổ sung)
 * @param {object} [params.record]     biên bản gần nhất FE có (đã gửi, result FAILED)
 * @returns {{ shown: boolean, title: string, reason: string|null, failedCriteria: string[], notes: Array<{scope:string,text:string}>, source: string }}
 */
export function resolveRejectedNotice({ car = null, record = null } = {}) {
  const failedCriteria = failedCriteriaOf(record)
  const notes = inspectionNotesOf(record)
  const backendReason = firstReasonField(car, record, record?.vehicleInfo)

  if (backendReason) {
    return {
      shown: true,
      title: 'Biên bản kiểm định đã bị trả lại',
      reason: backendReason,
      failedCriteria,
      notes,
      source: 'BACKEND_FIELD',
    }
  }

  if (record?.result === 'FAILED') {
    return {
      shown: true,
      title: 'Biên bản kiểm định trước không đạt chuẩn CPO',
      reason: failedCriteria.length
        ? `Xe không đạt ${failedCriteria.length}/5 tiêu chí CPO: ${failedCriteria.join('; ')}.`
        : 'Xe được chấm KHÔNG ĐẠT ở lần kiểm định trước.',
      failedCriteria,
      notes,
      source: 'INSPECTION_RECORD',
    }
  }

  // Chỉ còn trạng thái xe = REJECTED, không đọc được biên bản cũ (BE thiếu API theo carId).
  return {
    shown: true,
    title: 'Xe đang ở trạng thái kiểm định không đạt',
    reason: 'Lần kiểm định trước xe bị chấm KHÔNG ĐẠT chuẩn CPO. Vui lòng kiểm tra lại xe, '
      + 'lập biên bản mới và gửi lại để hệ thống chấm lại.',
    failedCriteria,
    notes,
    source: 'CAR_STATUS_ONLY',
  }
}
