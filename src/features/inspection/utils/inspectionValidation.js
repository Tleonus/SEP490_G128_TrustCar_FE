/**
 * KAN-55 – Kiểm tra tính hợp lệ của biên bản ngay trên giao diện.
 *
 * Mirror đúng luật của Backend (`inspectionSubmitRules.collectSubmitViolations`) để Sale
 * sửa hết một lượt trước khi bấm Gửi: nếu chỉ dựa vào BE thì mỗi lần gửi lại nhận một
 * danh sách lỗi tiếng Anh, còn ở đây mọi thiếu sót hiện ra trước, kèm nhãn tiếng Việt và
 * đường dẫn tới đúng nhóm tiêu chí. Ngoài ra có một luật chỉ FE cần: 5 checkbox tiêu chí
 * phải khớp với kết quả hạng mục, vì Backend tự suy ra tiêu chí từ hạng mục.
 */

import {
  INSPECTION_LIMITS as L,
  ITEM_RESULT,
  OVERVIEW_POSITIONS,
  OVERVIEW_POSITION_LABEL,
  VEHICLE_INFO_FIELDS,
} from '../constants/inspectionConstants'
import { countGroupEvidence, isGroupPassed, toNumberOrNull } from '../data/draftState'
import { isInspectionFolderUrl } from '../api/cloudinaryUpload'

const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''

/**
 * @typedef {object} Violation
 * @property {string} field    đường dẫn trong state, dùng để highlight
 * @property {string} code     mã lỗi (giống BE khi có)
 * @property {string} message  thông báo tiếng Việt
 * @property {string|null} groupKey  nhóm tiêu chí liên quan (để cuộn/mở đúng panel)
 * @property {'error'|'warning'} level
 */

/**
 * @param {object} params
 * @param {object} params.state        state biên bản (đã hydrate)
 * @param {object[]} params.checklist  định nghĩa 5 nhóm tiêu chí
 * @param {object} params.car          xe đang kiểm định (cần car.mileage)
 * @param {string} [params.inspectionId]
 * @returns {Violation[]}
 */
export function collectViolations({ state, checklist, car, inspectionId }) {
  const violations = []
  const add = (field, code, message, { groupKey = null, level = 'error' } = {}) =>
    violations.push({ field, code, message, groupKey, level })

  // ── 1. Thông tin xe đã xác nhận tại xưởng ────────────────────────────────
  const confirmed = state.vehicleInfo?.confirmed || {}
  VEHICLE_INFO_FIELDS.forEach(({ key, label }) => {
    if (isBlank(confirmed[key])) {
      add(`vehicleInfo.confirmed.${key}`, 'REQUIRED', `Chưa nhập "${label}".`)
    }
  })
  const confirmedMileage = toNumberOrNull(confirmed.mileage)
  const recordedMileage = toNumberOrNull(car?.mileage)
  if (confirmedMileage !== null && recordedMileage !== null && confirmedMileage < recordedMileage) {
    add('vehicleInfo.confirmed.mileage', 'MILEAGE_DECREASE',
      `Số km thực tế (${confirmedMileage.toLocaleString('vi-VN')}) không được nhỏ hơn số km trên hệ thống (${recordedMileage.toLocaleString('vi-VN')}).`)
  }
  const year = toNumberOrNull(confirmed.year)
  if (year !== null && year < L.MIN_YEAR) {
    add('vehicleInfo.confirmed.year', 'MIN_YEAR', `Năm sản xuất không được nhỏ hơn ${L.MIN_YEAR}.`)
  }

  // ── 2. Bốn ảnh tổng thể bắt buộc ────────────────────────────────────────
  OVERVIEW_POSITIONS.forEach((position) => {
    if (isBlank(state.overviewPhotos?.[position])) {
      add(`overviewPhotos.${position}`, 'REQUIRED', `Thiếu ảnh tổng thể: ${OVERVIEW_POSITION_LABEL[position]}.`)
    }
  })

  // ── 3. Từng nhóm tiêu chí ───────────────────────────────────────────────
  checklist.forEach((groupDef) => {
    const group = (state.groups || []).find((entry) => entry.groupKey === groupDef.key)
    if (!group) {
      add(`groups.${groupDef.key}`, 'GROUP_MISSING', `Chưa có dữ liệu nhóm "${groupDef.label}".`, { groupKey: groupDef.key })
      return
    }

    groupDef.items.forEach((itemDef) => {
      const entry = (group.items || []).find((item) => item.itemKey === itemDef.key)
      const field = `groups.${groupDef.key}.items.${itemDef.key}`
      const where = { groupKey: groupDef.key }

      if (!entry || !Object.values(ITEM_RESULT).includes(entry.result)) {
        add(field, 'ITEM_NOT_EVALUATED', `Chưa đánh giá "${itemDef.label}".`, where)
        return
      }
      if (entry.result === ITEM_RESULT.FAIL) {
        if (isBlank(entry.note)) {
          add(`${field}.note`, 'FAIL_NOTE_REQUIRED', `"${itemDef.label}": hạng mục không đạt cần ghi chú kỹ thuật.`, where)
        }
        if (!(entry.photos || []).length) {
          add(`${field}.photos`, 'FAIL_PHOTO_REQUIRED', `"${itemDef.label}": hạng mục không đạt cần ít nhất 1 ảnh.`, where)
        }
      } else if (entry.result === ITEM_RESULT.NOT_CHECKABLE && isBlank(entry.note)) {
        add(`${field}.note`, 'REASON_REQUIRED', `"${itemDef.label}": cần nêu lý do không kiểm tra được.`, where)
      }
      if (String(entry.note || '').length > L.NOTE_MAX_LENGTH) {
        add(`${field}.note`, 'TOO_LONG', `Ghi chú của "${itemDef.label}" vượt ${L.NOTE_MAX_LENGTH} ký tự.`, where)
      }
      if ((entry.photos || []).length > L.ITEM_PHOTOS_MAX) {
        add(`${field}.photos`, 'TOO_MANY', `"${itemDef.label}" tối đa ${L.ITEM_PHOTOS_MAX} ảnh.`, where)
      }
    })

    if (groupDef.requiresOdometerPhoto && isBlank(group.odometerPhoto)) {
      add(`groups.${groupDef.key}.odometerPhoto`, 'ODOMETER_PHOTO_REQUIRED',
        `"${groupDef.label}": bắt buộc có ảnh chụp đồng hồ ODO.`, { groupKey: groupDef.key })
    }
    if (countGroupEvidence(group) === 0) {
      add(`groups.${groupDef.key}.photos`, 'GROUP_PHOTO_REQUIRED',
        `"${groupDef.label}": mỗi nhóm tiêu chí cần ít nhất 1 ảnh bằng chứng.`, { groupKey: groupDef.key })
    }
    if ((group.photos || []).length > L.GROUP_PHOTOS_MAX) {
      add(`groups.${groupDef.key}.photos`, 'TOO_MANY', `"${groupDef.label}" tối đa ${L.GROUP_PHOTOS_MAX} ảnh.`, { groupKey: groupDef.key })
    }
    if (String(group.note || '').length > L.NOTE_MAX_LENGTH) {
      add(`groups.${groupDef.key}.note`, 'TOO_LONG', `Ghi chú của "${groupDef.label}" vượt ${L.NOTE_MAX_LENGTH} ký tự.`, { groupKey: groupDef.key })
    }

    const allowedTypes = new Set(groupDef.minorDefectTypes.map((type) => type.key))
    ;(group.minorDefects || []).forEach((defect, index) => {
      const field = `groups.${groupDef.key}.minorDefects.${index}`
      const where = { groupKey: groupDef.key }
      const label = groupDef.minorDefectTypes.find((type) => type.key === defect.type)?.label || defect.type || `Lỗi #${index + 1}`
      if (!allowedTypes.has(defect.type)) {
        add(`${field}.type`, 'MINOR_DEFECT_NOT_ALLOWED', `"${label}" không thuộc nhóm "${groupDef.label}".`, where)
      }
      if (isBlank(defect.location)) add(`${field}.location`, 'REQUIRED', `"${label}": thiếu vị trí.`, where)
      if (isBlank(defect.description)) add(`${field}.description`, 'REQUIRED', `"${label}": thiếu mô tả.`, where)
      if (!(defect.photos || []).length) add(`${field}.photos`, 'REQUIRED', `"${label}": cần ít nhất 1 ảnh.`, where)
      if ((defect.photos || []).length > L.MINOR_DEFECT_PHOTOS_MAX) {
        add(`${field}.photos`, 'TOO_MANY', `"${label}" tối đa ${L.MINOR_DEFECT_PHOTOS_MAX} ảnh.`, where)
      }
    })
    if ((group.minorDefects || []).length > L.MINOR_DEFECTS_MAX) {
      add(`groups.${groupDef.key}.minorDefects`, 'TOO_MANY',
        `"${groupDef.label}" tối đa ${L.MINOR_DEFECTS_MAX} lỗi nhỏ.`, { groupKey: groupDef.key })
    }

    // Luật chỉ FE có: checkbox tiêu chí phải khớp kết quả hạng mục mà BE sẽ suy ra.
    const asserted = Boolean(state.groupVerdicts?.[groupDef.key])
    const derived = isGroupPassed(group, groupDef)
    if (asserted !== derived) {
      add(`groups.${groupDef.key}.verdict`, 'CRITERIA_MISMATCH',
        asserted
          ? `Tiêu chí "${groupDef.label}" đang tích ĐẠT nhưng còn hạng mục chưa đạt/không kiểm tra được.`
          : `Tiêu chí "${groupDef.label}" đang bỏ tích, nhưng mọi hạng mục đều ĐẠT — hãy bỏ tích đúng một hạng mục hoặc bỏ tích lại tiêu chí.`,
        { groupKey: groupDef.key });
    }
  })

  // ── 4. Ảnh phải nằm trong thư mục Cloudinary của chính biên bản này ──────
  listStateImages(state).forEach(({ field, url, groupKey }) => {
    if (!isInspectionFolderUrl(url, inspectionId)) {
      add(field, 'INVALID_IMAGE_URL', 'Ảnh không thuộc thư mục bằng chứng của biên bản này.', { groupKey })
    }
  })

  return violations
}

/** Liệt kê mọi URL ảnh trong state kèm đường dẫn (giống listRecordImages của BE). */
export function listStateImages(state) {
  const images = []
  const push = (field, url, groupKey = null) => {
    if (!isBlank(url)) images.push({ field, url, groupKey })
  }

  OVERVIEW_POSITIONS.forEach((position) => push(`overviewPhotos.${position}`, state.overviewPhotos?.[position]))
  ;(state.groups || []).forEach((group) => {
    ;(group.photos || []).forEach((url, index) => push(`groups.${group.groupKey}.photos.${index}`, url, group.groupKey))
    push(`groups.${group.groupKey}.odometerPhoto`, group.odometerPhoto, group.groupKey)
    ;(group.items || []).forEach((item) =>
      (item.photos || []).forEach((url, index) =>
        push(`groups.${group.groupKey}.items.${item.itemKey}.photos.${index}`, url, group.groupKey)))
    ;(group.minorDefects || []).forEach((defect, defectIndex) =>
      (defect.photos || []).forEach((url, index) =>
        push(`groups.${group.groupKey}.minorDefects.${defectIndex}.photos.${index}`, url, group.groupKey)))
  })
  return images
}

/**
 * Dịch danh sách lỗi INSPECTION_INCOMPLETE của Backend (khi BE vẫn chặn) sang tiếng Việt,
 * để Sale biết còn thiếu gì mà không phải đọc field path thô.
 * @param {Array<{field:string, code?:string, message?:string}>} details
 * @param {object[]} checklist
 */
export function translateBackendViolations(details, checklist) {
  const groupOf = (field) => {
    const match = String(field || '').match(/^groups\.(\d+|[A-Z0-9_]+)/)
    if (!match) return null
    const token = match[1]
    if (/^\d+$/.test(token)) return checklist[Number(token)]?.key || null
    return checklist.some((group) => group.key === token) ? token : null
  }

  return (details || []).map((detail) => ({
    field: detail?.field || '',
    code: detail?.code || 'BACKEND',
    message: detail?.message || 'Dữ liệu chưa hợp lệ.',
    groupKey: groupOf(detail?.field),
    level: 'error',
  }))
}

/** Gom violation theo nhóm để hiển thị badge số lỗi trên từng panel tiêu chí. */
export function groupViolationCounts(violations) {
  return (violations || []).reduce((counts, violation) => {
    if (!violation.groupKey) return counts
    return { ...counts, [violation.groupKey]: (counts[violation.groupKey] || 0) + 1 }
  }, {})
}
