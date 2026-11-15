import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../../store/useAuthStore'
import { fetchProfile, updateProfile } from '../api/profileApi'
import { buildPatch } from '../utils/buildPatch'
import { todayLocalISO } from '../utils/dob'
import { mergeIntoUser } from '../utils/mergeUser'
import { classifyProfileError } from '../utils/profileErrors'
import { validateProfile } from '../utils/validateProfile'

/**
 * Tải hồ sơ một lần khi mở trang và lưu thay đổi.
 *
 * - `status`: 'loading' | 'ready' | 'error'. Khi tải lỗi KHÔNG có `profile`, nên giao diện không có form để lưu nhầm (REQ-F03).
 * - `save(values)` chỉ gửi các trường đã đổi, khóa gửi đôi bằng `savingRef` (REQ-F06), không tự thử lại,
 *   và khi 200 thì cập nhật hồ sơ gốc cùng `fullName`/`phone` trong store để Header đổi ngay (REQ-F07).
 * - Không ghi dữ liệu cá nhân ra console, không lưu bản nháp vào localStorage (REQ-F18).
 *
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F02
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F06
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F07
 */
export function useProfile() {
  const [state, setState] = useState({ status: 'loading', profile: null, error: null })
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchProfile(controller.signal)
      .then((profile) => setState({ status: 'ready', profile, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', profile: null, error: classifyProfileError(error) })
      })
    return () => controller.abort()
  }, [reloadKey])

  /** "Thử lại" sau khi tải lỗi. */
  const reload = useCallback(() => {
    setState({ status: 'loading', profile: null, error: null })
    setReloadKey((key) => key + 1)
  }, [])

  /**
   * @returns {Promise<{ ok: boolean, unchanged?: boolean, fieldErrors?: object, error?: object, profile?: object }>}
   */
  const save = useCallback(async (values) => {
    const { profile } = state
    if (savingRef.current || !profile) return { ok: false }

    const { valid, errors } = validateProfile(values, profile.editableFields, todayLocalISO(), profile)
    if (!valid) return { ok: false, fieldErrors: errors }
    const { patch, hasChanges } = buildPatch(profile, values, profile.editableFields)
    if (!hasChanges) return { ok: true, unchanged: true, profile }

    savingRef.current = true
    setSaving(true)
    try {
      const updated = await updateProfile(patch)
      setState({ status: 'ready', profile: updated, error: null })
      const { user, updateUser } = useAuthStore.getState()
      if (user) updateUser(mergeIntoUser(user, updated))
      return { ok: true, profile: updated }
    } catch (error) {
      const classified = classifyProfileError(error)
      return { ok: false, error: classified, fieldErrors: classified.fieldErrors }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [state])

  return { status: state.status, profile: state.profile, error: state.error, saving, save, reload }
}

export default useProfile
