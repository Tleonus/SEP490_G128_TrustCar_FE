import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSettings, updateSettings } from '../api/profileApi'
import { classifyProfileError } from '../utils/profileErrors'

/**
 * Cài đặt của khách (công tắc nhận email tiếp thị). Chỉ tải khi `enabled` (tab "Cài đặt" được mở) và một lần.
 *
 * `toggle(next)` khóa công tắc trong lúc lưu (REQ-F14): công tắc hiện giá trị đang chờ (`value` = `pending`),
 * thành công thì hiện đúng giá trị server trả về, lỗi thì trả về giá trị cũ và trả lỗi để giao diện báo.
 *
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F13
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F14
 * @param {boolean} enabled
 */
export function useSettings(enabled) {
  const [state, setState] = useState({ status: 'idle', marketingConsent: false, error: null })
  const [pending, setPending] = useState(null)
  const savingRef = useRef(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((current) => (current.status === 'ready' ? current : { ...current, status: 'loading', error: null }))
    fetchSettings(controller.signal)
      .then((data) => setState({ status: 'ready', marketingConsent: data.marketingConsent === true, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState((current) => ({ ...current, status: 'error', error: classifyProfileError(error) }))
      })
    return () => controller.abort()
  }, [enabled, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  /** @returns {Promise<{ ok: boolean, error?: object }>} */
  const toggle = useCallback(async (next) => {
    if (savingRef.current) return { ok: false }
    savingRef.current = true
    setPending(next)
    try {
      const saved = await updateSettings({ marketingConsent: next })
      setState({ status: 'ready', marketingConsent: saved.marketingConsent === true, error: null })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: classifyProfileError(error) } // công tắc tự trở về giá trị cũ vì `pending` được xóa
    } finally {
      savingRef.current = false
      setPending(null)
    }
  }, [])

  return {
    status: state.status,
    error: state.error,
    saving: pending !== null,
    value: pending ?? state.marketingConsent,
    toggle,
    reload,
  }
}

export default useSettings
