import { useCallback, useEffect, useState } from 'react'
import { getCertificateDetail, listCertificates } from '../data/cpoCertificateRepository'
import { classifyCertificateError } from '../utils/certificateErrors'

/**
 * Chạy một truy vấn bất đồng bộ, bỏ kết quả cũ khi tham số đổi, có reload() cho nút Thử lại.
 * @param {() => Promise<any>} fetcher
 * @param {string} key  Khoá tham số; đổi khoá → tải lại.
 */
function useAsyncQuery(fetcher, key) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => ({ ...prev, loading: true, error: null }))
    fetcher()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((err) => active && setState({ data: null, loading: false, error: classifyCertificateError(err) }))
    return () => {
      active = false
    }
    // fetcher được dựng lại mỗi lần render; chỉ tải lại khi khoá hoặc số lần thử đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, reload }
}

/** @param {ReturnType<import('../utils/certificateListParams').parseCertificateListParams>} query */
export function useCertificateList(query) {
  return useAsyncQuery(() => listCertificates(query), JSON.stringify(query))
}

/** @param {string} carId */
export function useCertificateDetail(carId) {
  return useAsyncQuery(() => getCertificateDetail(carId), carId)
}
