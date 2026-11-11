/**
 * KAN-55 – Hook điều phối toàn bộ màn lập biên bản kiểm định /admin/inspection/:carId.
 *
 * Luồng thật theo API Backend đang có:
 *   1. GET  /manage/cars/:carId                      thông tin xe + trạng thái
 *   2. POST /inspections/cars/:carId/draft           tạo nháp; nếu 409 (đã có nháp) thì
 *                                                    lấy id từ lỗi và GET /inspections/:id
 *   3. PATCH /inspections/:id                        lưu từng section đã thay đổi
 *   4. POST /inspections/:id/upload-signature        chữ ký upload ảnh bằng chứng
 *   5. POST /inspections/:id/submit                  BE chấm CPO trên bản ghi ĐÃ LƯU
 *
 * Hai ràng buộc phải tôn trọng:
 *   - Submit đọc dữ liệu trong DB, nên luôn PATCH phần đang bẩn TRƯỚC khi submit.
 *   - Biên bản đã SUBMITTED thì bị khoá (BE trả 409 INSPECTION_LOCKED cho mọi ghi).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getInspection,
  getManagedCar,
  loadOrCreateInspectionDraft,
  saveInspectionDraft,
  submitInspection,
  requestDraftUploadSignature,
} from '../api/inspectionApi'
import { createSignatureCache, uploadEvidencePhoto, validateEvidenceFile } from '../api/cloudinaryUpload'
import {
  INSPECTABLE_CAR_STATUSES,
  INSPECTION_STATUS,
  SUPPORTED_CHECKLIST_VERSION,
  getChecklistByVersion,
} from '../constants/inspectionConstants'
import {
  DIRTY,
  buildDraftPatch,
  cloneState,
  countEvidencePhotos,
  hasPatchContent,
  hydrateState,
  isGroupPassed,
} from '../data/draftState'
import { clearDraftCache, readDraftCache, writeDraftCache } from '../data/draftCache'
import { collectViolations, translateBackendViolations } from '../utils/inspectionValidation'
import { errorCodeOf, errorDetailsOf, inspectionErrorMessage, isLockedError } from '../utils/inspectionErrors'

/** Trạng thái xe cho phép mở màn lập biên bản. */
export function canInspectCar(car) {
  return Boolean(car) && INSPECTABLE_CAR_STATUSES.includes(car.status)
}

export function useInspectionDraft(carId) {
  const [car, setCar] = useState(null)
  const [loadingCar, setLoadingCar] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [record, setRecord] = useState(null)
  const [state, setState] = useState(null)
  const [dirty, setDirty] = useState(() => new Set())
  const [restoredFromCache, setRestoredFromCache] = useState(false)

  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [actionError, setActionError] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)

  const signatureCacheRef = useRef(null)

  const checklist = useMemo(
    () => getChecklistByVersion(state?.checklistVersion || SUPPORTED_CHECKLIST_VERSION),
    [state?.checklistVersion],
  )
  const checklistSupported = Boolean(checklist)
  const isLocked = state?.status === INSPECTION_STATUS.SUBMITTED
  const readOnly = !checklistSupported || isLocked
  const busy = starting || saving || submitting

  // ── 1. Tải thông tin xe ─────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingCar(true)
    setLoadError(null)
    setCar(null)

    getManagedCar(carId)
      .then((data) => {
        if (!active) return
        if (!data) {
          setLoadError('Không tìm thấy xe này trong hệ thống.')
          return
        }
        setCar(data)
      })
      .catch((error) => {
        if (!active) return
        setLoadError(inspectionErrorMessage(error, 'Không tải được thông tin xe.'))
      })
      .finally(() => {
        if (active) setLoadingCar(false)
      })

    return () => {
      active = false
    }
  }, [carId])

  // ── Chữ ký upload gắn với biên bản đang mở ──────────────────────────────
  const getSignatureCache = useCallback((inspectionId) => {
    if (!inspectionId) return null
    if (!signatureCacheRef.current || signatureCacheRef.current.inspectionId !== inspectionId) {
      signatureCacheRef.current = {
        inspectionId,
        cache: createSignatureCache(() => requestDraftUploadSignature(inspectionId)),
      }
    }
    return signatureCacheRef.current.cache
  }, [])

  /** Nhận state từ BE, khôi phục bản soạn dở nếu có (chống mất dữ liệu khi quay lại). */
  const adoptRecord = useCallback((nextRecord, { allowCacheRestore = true } = {}) => {
    const nextChecklist = getChecklistByVersion(nextRecord?.checklistVersion || SUPPORTED_CHECKLIST_VERSION)
    if (!nextChecklist) {
      setRecord(nextRecord)
      setState(null)
      return
    }
    const hydrated = hydrateState(nextRecord, nextChecklist)
    const cached = allowCacheRestore ? readDraftCache(carId) : null

    if (
      cached
      && cached.inspectionId === hydrated.inspectionId
      && Array.isArray(cached.dirty)
      && cached.dirty.length > 0
    ) {
      setRecord(nextRecord)
      setState(cached.state)
      setDirty(new Set(cached.dirty))
      setRestoredFromCache(true)
      return
    }

    setRecord(nextRecord)
    setState(hydrated)
    setDirty(new Set())
    setRestoredFromCache(false)
  }, [carId])

  /**
   * Tạo hoặc tải biên bản nháp của xe.
   * Với xe UNDER_INSPECTION thì gọi ngay khi mở màn (nháp gần như chắc chắn đã tồn tại,
   * lời gọi chỉ để lấy id). Với xe DRAFT/INCOMING/REJECTED thì chờ Sale bấm nút, vì tạo
   * nháp sẽ đổi trạng thái xe sang UNDER_INSPECTION — không tự đổi khi người dùng chỉ xem.
   */
  const startDraft = useCallback(async () => {
    if (!carId || starting) return null
    setStarting(true)
    setActionError(null)
    try {
      const { record: draftRecord, created } = await loadOrCreateInspectionDraft(carId)
      adoptRecord(draftRecord, { allowCacheRestore: !created })
      // Xe vừa được BE chuyển sang UNDER_INSPECTION khi tạo nháp mới.
      if (created) setCar((current) => (current ? { ...current, status: 'UNDER_INSPECTION' } : current))
      return draftRecord
    } catch (error) {
      if (isLockedError(error)) {
        // Xe đã có biên bản gửi rồi: mở ở chế độ chỉ xem.
        const existingId = errorDetailsOf(error).find((entry) => entry?.field === 'inspectionId')?.message
        if (existingId) {
          try {
            const submitted = await getInspection(existingId)
            adoptRecord(submitted, { allowCacheRestore: false })
            return submitted
          } catch {
            /* rơi xuống báo lỗi bên dưới */
          }
        }
      }
      const message = inspectionErrorMessage(error, 'Không mở được biên bản kiểm định.')
      setActionError(message)
      return null
    } finally {
      setStarting(false)
    }
  }, [adoptRecord, carId, starting])

  useEffect(() => {
    if (!car || car.status !== 'UNDER_INSPECTION' || state || starting) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startDraft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car?.status, car?._id]);

  // ── Cập nhật state + đánh dấu section bẩn ───────────────────────────────
  const markDirty = useCallback((keys) => {
    setDirty((current) => {
      const next = new Set(current)
      ;(Array.isArray(keys) ? keys : [keys]).forEach((key) => next.add(key))
      return next
    })
  }, [])

  const mutate = useCallback((updater, dirtyKeys) => {
    setState((current) => (current ? updater(cloneState(current)) : current))
    if (dirtyKeys) markDirty(dirtyKeys)
    setActionError(null)
  }, [markDirty])

  const mutateGroup = useCallback((groupKey, updater) => {
    mutate((draft) => {
      const index = draft.groups.findIndex((group) => group.groupKey === groupKey)
      if (index === -1) return draft
      draft.groups[index] = updater(draft.groups[index])
      return draft
    }, DIRTY.group(groupKey))
  }, [mutate])

  const setVehicleField = useCallback((key, value) => {
    mutate((draft) => {
      draft.vehicleInfo.confirmed[key] = value
      return draft
    }, DIRTY.VEHICLE_INFO)
  }, [mutate])

  const setOverviewPhoto = useCallback((position, url) => {
    mutate((draft) => {
      draft.overviewPhotos[position] = url
      return draft
    }, DIRTY.OVERVIEW_PHOTOS)
  }, [mutate])

  const setGroupNote = useCallback((groupKey, value) => {
    mutateGroup(groupKey, (group) => ({ ...group, note: value }))
  }, [mutateGroup])

  const setGroupPhotos = useCallback((groupKey, photos) => {
    mutateGroup(groupKey, (group) => ({ ...group, photos }))
  }, [mutateGroup])

  const setOdometerPhoto = useCallback((groupKey, url) => {
    mutateGroup(groupKey, (group) => ({ ...group, odometerPhoto: url }))
  }, [mutateGroup])

  const setItemResult = useCallback((groupKey, itemKey, result) => {
    mutateGroup(groupKey, (group) => ({
      ...group,
      items: group.items.map((item) => (item.itemKey === itemKey ? { ...item, result } : item)),
    }))
    // Kết quả hạng mục quyết định tiêu chí đạt/không đạt (BE suy ra từ hạng mục).
    setState((current) => {
      if (!current) return current
      const groupDef = checklist?.find((entry) => entry.key === groupKey)
      const group = current.groups.find((entry) => entry.groupKey === groupKey)
      if (!groupDef || !group) return current
      return { ...current, groupVerdicts: { ...current.groupVerdicts, [groupKey]: isGroupPassed(group, groupDef) } }
    })
  }, [checklist, mutateGroup])

  const setItemNote = useCallback((groupKey, itemKey, value) => {
    mutateGroup(groupKey, (group) => ({
      ...group,
      items: group.items.map((item) => (item.itemKey === itemKey ? { ...item, note: value } : item)),
    }))
  }, [mutateGroup])

  const setItemPhotos = useCallback((groupKey, itemKey, photos) => {
    mutateGroup(groupKey, (group) => ({
      ...group,
      items: group.items.map((item) => (item.itemKey === itemKey ? { ...item, photos } : item)),
    }))
  }, [mutateGroup])

  const setMinorDefects = useCallback((groupKey, minorDefects) => {
    mutateGroup(groupKey, (group) => ({ ...group, minorDefects }))
  }, [mutateGroup])

  /**
   * Checkbox của TrustCarInspectionChecklist: tích = "xe đạt tiêu chí này".
   * Tiện ích: các hạng mục CHƯA đánh giá được đặt PASS hàng loạt. Hạng mục đã đánh giá
   * (FAIL / NOT_CHECKABLE) được giữ nguyên để không mất dữ liệu Sale đã nhập.
   * Bỏ tích không xoá gì cả — chỉ là khẳng định tiêu chí không đạt, và panel kiểm tra
   * sẽ yêu cầu đánh dấu hạng mục tương ứng.
   */
  const setGroupVerdict = useCallback((groupKey, checked) => {
    setState((current) => {
      if (!current) return current
      const groupDef = checklist?.find((entry) => entry.key === groupKey)
      if (!groupDef) return current
      const groups = current.groups.map((group) => {
        if (group.groupKey !== groupKey || !checked) return group
        return {
          ...group,
          items: group.items.map((item) => (item.result ? item : { ...item, result: 'PASS' })),
        }
      })
      return { ...current, groups, groupVerdicts: { ...current.groupVerdicts, [groupKey]: checked } }
    })
    markDirty(DIRTY.group(groupKey))
    setActionError(null)
  }, [checklist, markDirty])

  /** "Đánh giá nhanh cả nhóm": đặt mọi hạng mục của nhóm về một kết quả. */
  const applyResultToGroup = useCallback((groupKey, result) => {
    mutateGroup(groupKey, (group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, result })),
    }))
    setState((current) => {
      if (!current) return current
      const groupDef = checklist?.find((entry) => entry.key === groupKey)
      const group = current.groups.find((entry) => entry.groupKey === groupKey)
      if (!groupDef || !group) return current
      const nextItems = group.items.map((item) => ({ ...item, result }))
      return {
        ...current,
        groupVerdicts: {
          ...current.groupVerdicts,
          [groupKey]: nextItems.every((item) => item.result === 'PASS'),
        },
      }
    })
  }, [checklist, mutateGroup])

  // ── Upload ảnh bằng chứng ───────────────────────────────────────────────
  const uploadEvidence = useCallback(async (file, { onProgress } = {}) => {
    const inspectionId = state?.inspectionId
    if (!inspectionId) {
      throw new Error('Chưa có biên bản nháp để đính kèm ảnh. Hãy bắt đầu lập biên bản trước.')
    }
    const cache = getSignatureCache(inspectionId)
    const signature = await cache.get()
    const invalid = validateEvidenceFile(file, signature.allowedFormats)
    if (invalid) throw new Error(invalid)

    setUploadingCount((count) => count + 1)
    try {
      const uploaded = await uploadEvidencePhoto(file, signature, { onProgress })
      return uploaded.url
    } catch (error) {
      // Chữ ký hết hạn hoặc biên bản vừa bị khoá: lần sau xin chữ ký mới.
      cache.invalidate()
      if (isLockedError(error) || errorCodeOf(error) === 'INSPECTION_LOCKED') {
        throw new Error('Biên bản đã được gửi, không thể thêm ảnh.', { cause: error })
      }
      throw error
    } finally {
      setUploadingCount((count) => Math.max(0, count - 1))
    }
  }, [getSignatureCache, state?.inspectionId])

  // ── Kiểm tra trước khi gửi ──────────────────────────────────────────────
  const violations = useMemo(() => {
    if (!state || !checklist || isLocked) return []
    return collectViolations({
      state,
      checklist,
      car,
      inspectionId: state.inspectionId,
    })
  }, [car, checklist, isLocked, state])

  const evidenceCount = useMemo(() => (state ? countEvidencePhotos(state) : 0), [state])

  // ── Lưu nháp ────────────────────────────────────────────────────────────
  const saveDraft = useCallback(async ({ quiet = false } = {}) => {
    const inspectionId = state?.inspectionId
    // Không chặn khi đang submit: submit cố tình lưu phần đang bẩn trước, vì Backend
    // chấm điểm trên bản ghi đã lưu trong DB.
    if (!inspectionId || saving || isLocked) return { ok: false, skipped: true }

    const patch = buildDraftPatch(state, dirty)
    if (!hasPatchContent(patch)) return { ok: true, skipped: true }

    setSaving(true)
    setActionError(null)
    try {
      const saved = await saveInspectionDraft(inspectionId, patch)
      setRecord(saved)
      setState((current) => (current ? { ...current, status: saved?.status || current.status } : current))
      setDirty(new Set())
      clearDraftCache(carId)
      return { ok: true, skipped: false, quiet }
    } catch (error) {
      const message = inspectionErrorMessage(error, 'Chưa lưu được biên bản.')
      setActionError(message)
      return { ok: false, message }
    } finally {
      setSaving(false)
    }
  }, [carId, dirty, isLocked, saving, state])

  // ── Gửi biên bản ────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (!state?.inspectionId || submitting || saving || isLocked) return { ok: false }

    if (evidenceCount === 0) {
      const message = 'Chưa có ảnh bằng chứng nào. Phải chụp và tải ảnh lên trước khi gửi biên bản.'
      setActionError(message)
      return { ok: false, message }
    }
    if (violations.length > 0) {
      const message = `Biên bản còn ${violations.length} mục cần hoàn tất. Xem danh sách bên dưới.`
      setActionError(message)
      return { ok: false, message, violations }
    }

    setSubmitting(true)
    setActionError(null)
    try {
      // BE chấm điểm trên bản ghi đã lưu → lưu hết phần đang bẩn trước.
      const saved = await saveDraft({ quiet: true })
      if (saved && saved.ok === false) {
        setSubmitting(false)
        return { ok: false, message: saved.message }
      }

      const result = await submitInspection(state.inspectionId)
      const submittedRecord = result?.inspectionRecord ?? null
      setSubmitResult(result || null)
      if (submittedRecord) {
        adoptRecord(submittedRecord, { allowCacheRestore: false })
      }
      if (result?.car) setCar(result.car)
      clearDraftCache(carId)
      signatureCacheRef.current = null
      setDirty(new Set())
      return { ok: true, result }
    } catch (error) {
      const details = errorDetailsOf(error)
      const message = inspectionErrorMessage(error, 'Không gửi được biên bản.')
      setActionError(message)
      return {
        ok: false,
        message,
        violations: errorCodeOf(error) === 'INSPECTION_INCOMPLETE' && checklist
          ? translateBackendViolations(details, checklist)
          : [],
      }
    } finally {
      setSubmitting(false)
    }
  }, [adoptRecord, carId, checklist, evidenceCount, isLocked, saveDraft, saving, state, submitting, violations])

  // ── Chống mất dữ liệu ───────────────────────────────────────────────────
  useEffect(() => {
    if (!state || dirty.size === 0) return undefined
    writeDraftCache(carId, {
      inspectionId: state.inspectionId,
      state: cloneState(state),
      dirty: Array.from(dirty),
      savedAt: Date.now(),
    })
    return undefined
  }, [carId, dirty, state])

  useEffect(() => {
    if (dirty.size === 0) return undefined
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty.size])

  const reloadCar = useCallback(async () => {
    try {
      const data = await getManagedCar(carId)
      if (data) setCar(data)
    } catch {
      /* giữ nguyên dữ liệu cũ, đã có thông báo ở nơi phát sinh lỗi */
    }
  }, [carId])

  return {
    // dữ liệu
    car,
    record,
    state,
    checklist,
    checklistSupported,
    violations,
    evidenceCount,
    submitResult,
    // trạng thái UI
    loadingCar,
    loadError,
    actionError,
    starting,
    saving,
    submitting,
    uploading: uploadingCount > 0,
    uploadingCount,
    busy,
    dirty,
    isDirty: dirty.size > 0,
    isLocked,
    readOnly,
    canStart: canInspectCar(car) && !state && !loadingCar,
    restoredFromCache,
    // hành động
    startDraft,
    saveDraft,
    submit,
    uploadEvidence,
    reloadCar,
    dismissRestored: () => setRestoredFromCache(false),
    dismissActionError: () => setActionError(null),
    setVehicleField,
    setOverviewPhoto,
    setGroupNote,
    setGroupPhotos,
    setOdometerPhoto,
    setItemResult,
    setItemNote,
    setItemPhotos,
    setMinorDefects,
    setGroupVerdict,
    applyResultToGroup,
  }
}

export default useInspectionDraft
