import { useEffect, useRef, useState } from 'react'
import { fetchDeposit } from '../api/depositApi'

/**
 * KAN-99 — poll GET /deposits/:id định kỳ (3 s/lần) cho đến khi `paymentStatus`
 * đạt `targetStatus`, hoặc đã poll quá `timeoutMs`.
 *
 * Trả về:
 *  - `deposit`:      bản deposit mới nhất đọc từ BE (hoặc `null`)
 *  - `status`:       'polling' | 'reached' | 'timeout' | 'error'
 *  - `error`:        message nếu status === 'error'
 *  - `elapsedMs`:    thời gian đã trôi
 *  - `forceRefresh`: callback để refetch ngay lập tức
 *
 * Dừng poll sau khi reached/timeout/error để không tốn bandwidth. Hook cũng
 * tự dừng khi component unmount (dùng flag `cancelled`).
 */
export default function usePaymentPolling({
  depositId,
  targetStatus = 'DEPOSIT_PAID',
  intervalMs = 3_000,
  timeoutMs = 90_000,
  enabled = true,
}) {
  const [deposit, setDeposit] = useState(null)
  const [status, setStatus] = useState('polling')
  const [error, setError] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const cancelledRef = useRef(false)

  const fetchOnce = async () => {
    if (!depositId || cancelledRef.current) return null
    try {
      const data = await fetchDeposit(depositId)
      if (cancelledRef.current) return null
      setDeposit(data)
      return data
    } catch (err) {
      if (cancelledRef.current) return null
      setError(err?.response?.data?.message || err?.message || 'Không tải được trạng thái cọc.')
      setStatus('error')
      return null
    }
  }

  useEffect(() => {
    cancelledRef.current = false
    if (!enabled || !depositId) return undefined

    let timerId = null
    const startedAt = Date.now()

    const tick = async () => {
      const data = await fetchOnce()
      if (cancelledRef.current) return
      setElapsedMs(Date.now() - startedAt)
      if (data?.paymentStatus === targetStatus) {
        setStatus('reached')
        return
      }
      if (Date.now() - startedAt >= timeoutMs) {
        setStatus('timeout')
        return
      }
      timerId = setTimeout(tick, intervalMs)
    }
    tick()

    return () => {
      cancelledRef.current = true
      if (timerId) clearTimeout(timerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositId, targetStatus, intervalMs, timeoutMs, enabled])

  return {
    deposit,
    status,
    error,
    elapsedMs,
    forceRefresh: fetchOnce,
  }
}
