/**
 * KAN-55 – Chuẩn hoá biên bản kiểm định giữa Backend và state của giao diện.
 *
 * Backend lưu `groups[].items[].result` (PASS/FAIL/NOT_CHECKABLE) và tự suy ra 5 tiêu chí
 * khi gửi: một nhóm chỉ "đạt" khi MỌI hạng mục của nó PASS (computeGroupResults →
 * deriveCriteria → evaluateCPO). Vì vậy 5 checkbox trên component
 * `TrustCarInspectionChecklist.jsx` được ràng buộc với kết quả hạng mục, không phải
 * một giá trị độc lập — nếu không Backend sẽ chấm khác những gì Sale tích chọn.
 */

import {
  GROUP_TO_CRITERION,
  ITEM_RESULT,
  OVERVIEW_POSITIONS,
} from '../constants/inspectionConstants'

/** Section có thể gửi trong PATCH /inspections/:id. */
export const DIRTY = {
  VEHICLE_INFO: 'vehicleInfo',
  OVERVIEW_PHOTOS: 'overviewPhotos',
  group: (groupKey) => `group:${groupKey}`,
}

const isBlank = (value) => value === null || value === undefined || String(value).trim() === ''

export function toNumberOrNull(value) {
  if (isBlank(value)) return null
  const parsed = Number(String(value).replace(/[,\s]/g, ''))
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

/** Nhóm "đạt" theo đúng công thức của Backend: mọi hạng mục đều PASS. */
export function isGroupPassed(group, groupDef) {
  if (!group || !groupDef) return false
  return groupDef.items.every((itemDef) => {
    const entry = (group.items || []).find((item) => item.itemKey === itemDef.key)
    return entry?.result === ITEM_RESULT.PASS
  })
}

/** Trạng thái FE dùng để render; luôn đủ 5 nhóm và đủ hạng mục kể cả khi BE trả thiếu. */
export function createEmptyState({ inspectionId, carId, checklistVersion, checklist, status, source }) {
  return {
    inspectionId,
    carId,
    checklistVersion,
    status,
    source,
    vehicleInfo: {
      confirmed: { make: '', model: '', variant: '', color: '', year: '', mileage: '' },
    },
    overviewPhotos: Object.fromEntries(OVERVIEW_POSITIONS.map((position) => [position, null])),
    groups: checklist.map((groupDef) => ({
      groupKey: groupDef.key,
      note: '',
      photos: [],
      odometerPhoto: null,
      minorDefects: [],
      items: groupDef.items.map((itemDef) => ({ itemKey: itemDef.key, result: null, note: '', photos: [] })),
    })),
    groupVerdicts: Object.fromEntries(checklist.map((groupDef) => [groupDef.key, false])),
    submitted: null,
  }
}

const toText = (value) => (isBlank(value) ? '' : String(value))

/**
 * Ghép bản ghi Backend vào state giao diện. Trường nào BE không trả (bản ghi cũ)
 * thì lấy khung rỗng, để form luôn đủ 5 nhóm / đủ hạng mục.
 */
export function hydrateState(record, checklist) {
  const base = createEmptyState({
    inspectionId: record?._id ?? null,
    carId: record?.carId ?? null,
    checklistVersion: record?.checklistVersion ?? null,
    checklist,
    status: record?.status ?? null,
    source: record?.source ?? null,
  })
  if (!record) return base

  const confirmed = record.vehicleInfo?.confirmed || {}
  base.vehicleInfo.confirmed = {
    make: toText(confirmed.make),
    model: toText(confirmed.model),
    variant: toText(confirmed.variant),
    color: toText(confirmed.color),
    year: isBlank(confirmed.year) ? '' : String(confirmed.year),
    mileage: isBlank(confirmed.mileage) ? '' : String(confirmed.mileage),
  }

  OVERVIEW_POSITIONS.forEach((position) => {
    base.overviewPhotos[position] = record.overviewPhotos?.[position] || null
  })

  base.groups = checklist.map((groupDef) => {
    const group = (record.groups || []).find((entry) => entry.groupKey === groupDef.key) || {}
    return {
      groupKey: groupDef.key,
      note: toText(group.note),
      photos: Array.isArray(group.photos) ? group.photos.filter(Boolean) : [],
      odometerPhoto: group.odometerPhoto || null,
      minorDefects: Array.isArray(group.minorDefects)
        ? group.minorDefects.map((defect) => ({
          type: toText(defect.type),
          location: toText(defect.location),
          description: toText(defect.description),
          photos: Array.isArray(defect.photos) ? defect.photos.filter(Boolean) : [],
        }))
        : [],
      items: groupDef.items.map((itemDef) => {
        const entry = (group.items || []).find((item) => item.itemKey === itemDef.key) || {}
        return {
          itemKey: itemDef.key,
          result: Object.values(ITEM_RESULT).includes(entry.result) ? entry.result : null,
          note: toText(entry.note),
          photos: Array.isArray(entry.photos) ? entry.photos.filter(Boolean) : [],
        }
      }),
    }
  })

  base.groupVerdicts = Object.fromEntries(
    checklist.map((groupDef) => {
      const group = base.groups.find((entry) => entry.groupKey === groupDef.key)
      return [groupDef.key, isGroupPassed(group, groupDef)]
    }),
  )

  if (record.status === 'SUBMITTED') {
    base.submitted = {
      result: record.result || null,
      criteria: record.criteria || null,
      notes: toText(record.notes),
      odo: record.odo ?? null,
      submittedAt: record.submittedAt || null,
      cpoCertificateId: record.cpoCertificateId || null,
      evidenceImages: Array.isArray(record.evidenceImages) ? record.evidenceImages : [],
    }
  }

  return base
}

/**
 * Giá trị cho props `checks` / `checkedCount` của TrustCarInspectionChecklist.jsx.
 * Component dùng id tiêu chí (chassis/engine/flood/odometer/safety) — ánh xạ sang groupKey.
 */
export function deriveChecks(state) {
  const checks = {}
  Object.entries(GROUP_TO_CRITERION).forEach(([groupKey, criterionId]) => {
    checks[criterionId] = Boolean(state.groupVerdicts?.[groupKey])
  })
  return checks
}

export function countChecked(checks) {
  return Object.values(checks || {}).filter(Boolean).length
}

/** Số ảnh bằng chứng đang có trong toàn biên bản. */
export function countEvidencePhotos(state) {
  const overview = OVERVIEW_POSITIONS.filter((position) => !isBlank(state.overviewPhotos?.[position])).length
  const groups = (state.groups || []).reduce((sum, group) => sum + countGroupEvidence(group), 0)
  return overview + groups
}

/** Ảnh bằng chứng của một nhóm: ảnh nhóm + ảnh từng hạng mục + ảnh ODO (đúng như BE đếm). */
export function countGroupEvidence(group) {
  const itemPhotos = (group.items || []).reduce((sum, item) => sum + (item.photos || []).length, 0)
  const defectPhotos = (group.minorDefects || []).reduce((sum, defect) => sum + (defect.photos || []).length, 0)
  return (group.photos || []).length + itemPhotos + defectPhotos + (isBlank(group.odometerPhoto) ? 0 : 1)
}

const cleanItem = (item) => ({
  itemKey: item.itemKey,
  result: item.result || null,
  note: String(item.note || ''),
  photos: (item.photos || []).filter(Boolean),
})

const cleanDefect = (defect) => ({
  type: defect.type,
  location: String(defect.location || ''),
  description: String(defect.description || ''),
  photos: (defect.photos || []).filter(Boolean),
})

/** Group đúng shape Joi của BE (không gửi `passed` — trường này BE tự tính khi submit). */
const cleanGroup = (group) => ({
  groupKey: group.groupKey,
  note: String(group.note || ''),
  photos: (group.photos || []).filter(Boolean),
  odometerPhoto: group.odometerPhoto || null,
  minorDefects: (group.minorDefects || []).filter((defect) => !isBlank(defect.type)).map(cleanDefect),
  items: (group.items || []).map(cleanItem),
})

/**
 * Dựng body PATCH chỉ gồm các section đã thay đổi.
 * BE thay thế trọn vẹn section được gửi, nên mỗi group gửi đi phải đầy đủ.
 * @param {object} state
 * @param {Set<string>|string[]} dirtySections
 */
export function buildDraftPatch(state, dirtySections) {
  const dirty = dirtySections instanceof Set ? dirtySections : new Set(dirtySections || [])
  const patch = {}

  if (dirty.has(DIRTY.VEHICLE_INFO)) {
    const confirmed = state.vehicleInfo.confirmed
    patch.vehicleInfo = {
      confirmed: {
        make: toText(confirmed.make) || null,
        model: toText(confirmed.model) || null,
        variant: toText(confirmed.variant) || null,
        color: toText(confirmed.color) || null,
        year: toNumberOrNull(confirmed.year),
        mileage: toNumberOrNull(confirmed.mileage),
      },
    }
  }

  if (dirty.has(DIRTY.OVERVIEW_PHOTOS)) {
    patch.overviewPhotos = Object.fromEntries(
      OVERVIEW_POSITIONS.map((position) => [position, state.overviewPhotos[position] || null]),
    )
  }

  const dirtyGroups = (state.groups || []).filter((group) => dirty.has(DIRTY.group(group.groupKey)))
  if (dirtyGroups.length) patch.groups = dirtyGroups.map(cleanGroup)

  return patch
}

export function hasPatchContent(patch) {
  return Boolean(patch && (patch.vehicleInfo || patch.overviewPhotos || patch.groups?.length))
}

/** Sao sâu state để lưu tạm (khôi phục khi người dùng quay lại trang). */
export function cloneState(state) {
  return {
    ...state,
    vehicleInfo: { confirmed: { ...state.vehicleInfo.confirmed } },
    overviewPhotos: { ...state.overviewPhotos },
    groupVerdicts: { ...state.groupVerdicts },
    groups: state.groups.map((group) => ({
      ...group,
      photos: [...group.photos],
      minorDefects: group.minorDefects.map((defect) => ({ ...defect, photos: [...defect.photos] })),
      items: group.items.map((item) => ({ ...item, photos: [...item.photos] })),
    })),
  }
}
