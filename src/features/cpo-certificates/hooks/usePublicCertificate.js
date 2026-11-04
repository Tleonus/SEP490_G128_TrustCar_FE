import { useCallback, useEffect, useState } from 'react'
import { getPublicInspectionReport } from '../api/cpoCertificateApi'

/**
 * Chứng nhận công khai của một xe cho SCR-M05.
 * 404 nghĩa là xe không có chứng nhận công khai → report = null, không phải lỗi.
 *
 * @param {string|null} carKey  Mã xe hoặc ObjectId; null → chưa tải.
 * @returns {{ report: object|null, loading: boolean, failed: boolean, reload: () => void }}
 */
export function usePublicCertificate(carKey) {
  const [state, setState] = useState({ report: null, loading: Boolean(carKey), failed: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!carKey) return undefined
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ report: null, loading: true, failed: false })
    getPublicInspectionReport(carKey)
      .then((report) => active && setState({ report: report ?? null, loading: false, failed: false }))
      .catch((err) => {
        if (!active) return
        const notFound = err?.response?.status === 404
        setState({ report: null, loading: false, failed: !notFound })
      })
    return () => {
      active = false
    }
  }, [carKey, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, reload }
}
