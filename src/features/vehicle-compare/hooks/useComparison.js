import { useCallback, useEffect, useState } from 'react'
import { fetchComparison } from '../api/compareApi'
import { classifyCompareError } from '../utils/compareErrors'

/**
 * Tải dữ liệu so sánh đúng một lần cho bộ id truyền vào (kèm "thử lại").
 * Bộ id nên là ảnh chụp tại lúc mở trang: bỏ xe trên trang không làm gọi lại API.
 *
 * status: 'idle' (không có id) | 'loading' | 'success' | 'error'.
 * error: { kind, message, unavailableIds } từ classifyCompareError.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F12
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F19
 * @param {string[]} ids
 */
export function useComparison(ids) {
  const key = ids.join(',')
  const [state, setState] = useState({ status: key ? 'loading' : 'idle', data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!key) return undefined

    const controller = new AbortController()
    fetchComparison(key.split(','), controller.signal)
      .then((data) => setState({ status: 'success', data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', data: null, error: classifyCompareError(error) })
      })

    return () => controller.abort()
  }, [key, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', data: null, error: null })
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, retry }
}
